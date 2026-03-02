import {
  ECSClient,
  RunTaskCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "./types.js";

const ecs = new ECSClient({});

const TASK_DEF_ARN = process.env.SANDBOX_TASK_DEF_ARN!;
const SANDBOX_SG_ID = process.env.SANDBOX_SG_ID!;
const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME!;
const SUBNET_IDS = (process.env.SUBNET_IDS ?? "").split(",");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function launchSandbox(
  ctx: ServiceContext,
  agentId: string,
): Promise<SandboxSession> {
  // 1. Check for existing EBS volume for this agent
  const table = ctx.resources.ddb.table;
  const existing = await table.getDocumentClient().send(
    new GetCommand({
      TableName: table.getName(),
      Key: { pk: "SANDBOX_VOLUME", sk: `SANDBOX_VOLUME#${agentId}` },
    }),
  );
  const existingVolume = existing.Item as
    | { volumeId: string; availabilityZone: string; sizeGiB: number }
    | undefined;

  // 2. Build volume configuration
  const volumeConfiguration = existingVolume
    ? {
        name: "workspace",
        managedEBSVolume: {
          volumeType: "gp3" as const,
          sizeInGiB: existingVolume.sizeGiB,
          snaphotId: undefined,
          roleArn: undefined,
        },
      }
    : undefined;

  // 3. Launch ECS task
  const runResult = await ecs.send(
    new RunTaskCommand({
      cluster: CLUSTER_NAME,
      taskDefinition: TASK_DEF_ARN,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: SUBNET_IDS,
          securityGroups: [SANDBOX_SG_ID],
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

  // 4. Poll for task to be RUNNING and have a private IP
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

  // 5. Store volume mapping in DDB if first launch
  if (!existingVolume) {
    const now = new Date().toISOString();
    await table.getDocumentClient().send(
      new PutCommand({
        TableName: table.getName(),
        Item: {
          agentId,
          volumeId: "pending", // Updated when EBS details available
          availabilityZone: "us-east-1a",
          sizeGiB: 10,
          createdAt: now,
          lastUsedAt: now,
          _et: "SandboxVolume",
          pk: "SANDBOX_VOLUME",
          sk: `SANDBOX_VOLUME#${agentId}`,
        },
      }),
    );
  } else {
    // Update lastUsedAt
    await table.getDocumentClient().send(
      new PutCommand({
        TableName: table.getName(),
        Item: {
          ...existingVolume,
          agentId,
          lastUsedAt: new Date().toISOString(),
          _et: "SandboxVolume",
          pk: "SANDBOX_VOLUME",
          sk: `SANDBOX_VOLUME#${agentId}`,
        },
      }),
    );
  }

  return {
    taskArn,
    privateIp,
    wsUrl: `ws://${privateIp}:8080`,
    agentId,
  };
}
