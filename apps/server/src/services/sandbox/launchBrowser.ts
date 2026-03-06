import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
} from "@aws-sdk/client-ecs";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { createLogger } from "../../logger.js";
import type { BrowserSession } from "./types.js";

const log = createLogger("sandbox:browser-launch");
const ecs = new ECSClient({});
const ssm = new SSMClient({});

const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME ?? "";
const SUBNET_IDS = (process.env.SUBNET_IDS ?? "").split(",");

let cachedTaskDefArn: string | undefined;
let cachedSgId: string | undefined;

async function getBrowserConfig(): Promise<{
  taskDefArn: string;
  sgId: string;
}> {
  if (cachedTaskDefArn && cachedSgId) {
    return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
  }

  if (process.env.BROWSER_TASK_DEF_ARN && process.env.BROWSER_SG_ID) {
    log.info("Loading browser config from env vars");
    cachedTaskDefArn = process.env.BROWSER_TASK_DEF_ARN;
    cachedSgId = process.env.BROWSER_SG_ID;
  } else {
    log.info("Loading browser config from SSM");
    const [taskDefRes, sgRes] = await Promise.all([
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/browser-task-def-arn" }),
      ),
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/browser-sg-id" }),
      ),
    ]);
    cachedTaskDefArn = taskDefRes.Parameter?.Value;
    cachedSgId = sgRes.Parameter?.Value;
    log.info({ taskDefArn: cachedTaskDefArn, sgId: cachedSgId }, "Browser SSM config loaded");
  }

  if (!cachedTaskDefArn || !cachedSgId) {
    throw new Error("Browser config not found in env vars or SSM");
  }
  return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function launchBrowser(agentId: string): Promise<BrowserSession> {
  log.info({ agentId }, "Launching browser Fargate task");

  const { taskDefArn, sgId } = await getBrowserConfig();

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
          assignPublicIp: "DISABLED",
        },
      },
    }),
  );

  const taskArn = runResult.tasks?.[0]?.taskArn;
  if (!taskArn) {
    log.error({ agentId, failures: runResult.failures }, "Browser RunTask failed");
    throw new Error(
      `Failed to launch browser task: ${JSON.stringify(runResult.failures)}`,
    );
  }

  log.info({ agentId, taskArn }, "Browser task submitted, polling for RUNNING");

  let privateIp: string | undefined;
  const maxAttempts = 30; // 90s
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    const desc = await ecs.send(
      new DescribeTasksCommand({ cluster: CLUSTER_NAME, tasks: [taskArn] }),
    );

    const task = desc.tasks?.[0];
    if (!task) continue;

    log.debug({ agentId, attempt: i + 1, status: task.lastStatus }, "Polling browser task");

    if (task.lastStatus === "STOPPED") {
      throw new Error(`Browser task stopped: ${task.stoppedReason}`);
    }

    if (task.lastStatus === "RUNNING") {
      const eni = task.attachments
        ?.find((a) => a.type === "ElasticNetworkInterface")
        ?.details?.find((d) => d.name === "privateIPv4Address");
      if (eni?.value) {
        privateIp = eni.value;
        log.info({ agentId, taskArn, privateIp, attempts: i + 1 }, "Browser task running");
        break;
      }
    }
  }

  if (!privateIp) {
    throw new Error("Browser task did not become ready within 90s");
  }

  return { taskArn, privateIp, agentId };
}
