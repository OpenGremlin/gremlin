import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
} from "@aws-sdk/client-ecs";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { createLogger } from "../../logger.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:launch");
const ecs = new ECSClient({});
const ssm = new SSMClient({});

const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME ?? "";
const SUBNET_IDS = (process.env.SUBNET_IDS ?? "").split(",");

let cachedTaskDefArn: string | undefined;
let cachedSgId: string | undefined;

async function getSandboxConfig(): Promise<{
  taskDefArn: string;
  sgId: string;
}> {
  if (cachedTaskDefArn && cachedSgId) {
    log.debug("Using cached sandbox config");
    return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
  }

  // Check env vars first (local dev), fall back to SSM (prod)
  if (process.env.SANDBOX_TASK_DEF_ARN && process.env.SANDBOX_SG_ID) {
    log.info("Loading sandbox config from env vars");
    cachedTaskDefArn = process.env.SANDBOX_TASK_DEF_ARN;
    cachedSgId = process.env.SANDBOX_SG_ID;
  } else {
    log.info("Loading sandbox config from SSM");
    const [taskDefRes, sgRes] = await Promise.all([
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/sandbox-task-def-arn" }),
      ),
      ssm.send(new GetParameterCommand({ Name: "/gremlin/sandbox-sg-id" })),
    ]);
    cachedTaskDefArn = taskDefRes.Parameter?.Value;
    cachedSgId = sgRes.Parameter?.Value;
    log.info({ taskDefArn: cachedTaskDefArn, sgId: cachedSgId }, "SSM config loaded");
  }

  if (!cachedTaskDefArn || !cachedSgId) {
    throw new Error("Sandbox config not found in env vars or SSM");
  }
  return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SANDBOX_LOCAL = process.env.SANDBOX_LOCAL === "true";
const SANDBOX_LOCAL_WS_URL = process.env.SANDBOX_LOCAL_WS_URL ?? "ws://localhost:8080";

export async function launchSandbox(agentId: string): Promise<SandboxSession> {
  if (SANDBOX_LOCAL) {
    log.info({ agentId, wsUrl: SANDBOX_LOCAL_WS_URL }, "Using local sandbox");
    return {
      taskArn: "local",
      privateIp: "127.0.0.1",
      wsUrl: SANDBOX_LOCAL_WS_URL,
      agentId,
    };
  }

  log.info({ agentId }, "Launching sandbox");

  const { taskDefArn, sgId } = await getSandboxConfig();
  log.info({ agentId, taskDefArn, sgId, cluster: CLUSTER_NAME, subnets: SUBNET_IDS }, "ECS RunTask config");

  const runResult = await ecs.send(
    new RunTaskCommand({
      cluster: CLUSTER_NAME,
      taskDefinition: taskDefArn,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: SUBNET_IDS,
          securityGroups: [sgId],
          assignPublicIp: "ENABLED",
        },
      },
    }),
  );

  const taskArn = runResult.tasks?.[0]?.taskArn;
  if (!taskArn) {
    log.error({ agentId, failures: runResult.failures }, "ECS RunTask failed");
    throw new Error(
      `Failed to launch sandbox task: ${JSON.stringify(runResult.failures)}`,
    );
  }

  log.info({ agentId, taskArn }, "ECS task submitted, polling for RUNNING status");

  // Poll for task to be RUNNING and have a private IP
  let privateIp: string | undefined;
  const maxAttempts = 30; // 30 * 3s = 90s
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    const desc = await ecs.send(
      new DescribeTasksCommand({
        cluster: CLUSTER_NAME,
        tasks: [taskArn],
      }),
    );

    const task = desc.tasks?.[0];
    if (!task) {
      log.debug({ agentId, attempt: i + 1 }, "Task not found yet");
      continue;
    }

    log.debug(
      { agentId, attempt: i + 1, lastStatus: task.lastStatus, desiredStatus: task.desiredStatus },
      "Polling task status",
    );

    if (task.lastStatus === "STOPPED") {
      log.error({ agentId, taskArn, stoppedReason: task.stoppedReason, stopCode: task.stopCode }, "Task stopped unexpectedly");
      throw new Error(
        `Sandbox task stopped unexpectedly: ${task.stoppedReason}`,
      );
    }

    if (task.lastStatus === "RUNNING") {
      const eni = task.attachments
        ?.find((a) => a.type === "ElasticNetworkInterface")
        ?.details?.find((d) => d.name === "privateIPv4Address");
      if (eni?.value) {
        privateIp = eni.value;
        log.info({ agentId, taskArn, privateIp, attempts: i + 1 }, "Task is RUNNING with private IP");
        break;
      }
      log.debug({ agentId, attempt: i + 1 }, "Task RUNNING but no private IP yet");
    }
  }

  if (!privateIp) {
    log.error({ agentId, taskArn }, "Task did not become ready within 90s");
    throw new Error("Sandbox task did not become ready within 90s");
  }

  const session: SandboxSession = {
    taskArn,
    privateIp,
    wsUrl: `ws://${privateIp}:8080`,
    agentId,
  };

  log.info({ agentId, taskArn, privateIp, wsUrl: session.wsUrl }, "Sandbox launched successfully");
  return session;
}
