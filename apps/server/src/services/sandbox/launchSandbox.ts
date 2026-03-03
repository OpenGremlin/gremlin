import {
  ECSClient,
  RunTaskCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  SSMClient,
  GetParameterCommand,
} from "@aws-sdk/client-ssm";
import type { SandboxSession } from "./types.js";

const ecs = new ECSClient({});
const ssm = new SSMClient({});

const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME!;
const SUBNET_IDS = (process.env.SUBNET_IDS ?? "").split(",");

let cachedTaskDefArn: string | undefined;
let cachedSgId: string | undefined;

async function getSandboxConfig(): Promise<{
  taskDefArn: string;
  sgId: string;
}> {
  if (cachedTaskDefArn && cachedSgId) {
    return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
  }

  // Check env vars first (local dev), fall back to SSM (prod)
  if (process.env.SANDBOX_TASK_DEF_ARN && process.env.SANDBOX_SG_ID) {
    cachedTaskDefArn = process.env.SANDBOX_TASK_DEF_ARN;
    cachedSgId = process.env.SANDBOX_SG_ID;
  } else {
    const [taskDefRes, sgRes] = await Promise.all([
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/sandbox-task-def-arn" }),
      ),
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/sandbox-sg-id" }),
      ),
    ]);
    cachedTaskDefArn = taskDefRes.Parameter?.Value;
    cachedSgId = sgRes.Parameter?.Value;
  }

  if (!cachedTaskDefArn || !cachedSgId) {
    throw new Error("Sandbox config not found in env vars or SSM");
  }
  return { taskDefArn: cachedTaskDefArn, sgId: cachedSgId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function launchSandbox(
  agentId: string,
): Promise<SandboxSession> {
  const { taskDefArn, sgId } = await getSandboxConfig();

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
    throw new Error(
      `Failed to launch sandbox task: ${JSON.stringify(runResult.failures)}`,
    );
  }

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
    if (!task) continue;

    if (task.lastStatus === "STOPPED") {
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
        break;
      }
    }
  }

  if (!privateIp) {
    throw new Error("Sandbox task did not become ready within 90s");
  }

  return {
    taskArn,
    privateIp,
    wsUrl: `ws://${privateIp}:8080`,
    agentId,
  };
}
