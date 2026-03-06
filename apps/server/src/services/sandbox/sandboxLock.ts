import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";

const log = createLogger("sandbox:lock");

const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes safety TTL

function lockPk(agentId: string) {
  return `SANDBOX_LOCK#${agentId}`;
}

export async function acquireSandboxLock(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<{ acquired: true } | { acquired: false; ownerTaskId: string }> {
  const table = ctx.resources.ddb.table;
  const now = new Date().toISOString();
  const ttl = Math.floor((Date.now() + LOCK_TTL_MS) / 1000);

  try {
    await table.getDocumentClient().send(
      new PutCommand({
        TableName: table.getName(),
        Item: {
          _et: "SandboxLock",
          pk: lockPk(agentId),
          sk: "LOCK",
          ownerTaskId: taskId,
          status: "provisioning",
          acquiredAt: now,
          ttl,
        },
        ConditionExpression: "attribute_not_exists(pk) OR #s = :available",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":available": "available" },
      }),
    );

    log.info({ agentId, taskId }, "Sandbox lock acquired");
    return { acquired: true };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === "ConditionalCheckFailedException"
    ) {
      // Lock held by someone else — read to get owner
      const result = await table.getDocumentClient().send(
        new QueryCommand({
          TableName: table.getName(),
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: {
            ":pk": lockPk(agentId),
            ":sk": "LOCK",
          },
          Limit: 1,
        }),
      );
      const owner = (result.Items?.[0]?.ownerTaskId as string) ?? "unknown";
      log.info({ agentId, taskId, ownerTaskId: owner }, "Sandbox lock busy");
      return { acquired: false, ownerTaskId: owner };
    }
    throw err;
  }
}

export async function releaseSandboxLock(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<void> {
  const table = ctx.resources.ddb.table;
  const now = new Date().toISOString();
  const ttl = Math.floor((Date.now() + LOCK_TTL_MS) / 1000);

  try {
    await table.getDocumentClient().send(
      new PutCommand({
        TableName: table.getName(),
        Item: {
          _et: "SandboxLock",
          pk: lockPk(agentId),
          sk: "LOCK",
          ownerTaskId: taskId,
          status: "available",
          acquiredAt: now,
          ttl,
        },
        ConditionExpression: "ownerTaskId = :tid",
        ExpressionAttributeValues: { ":tid": taskId },
      }),
    );
    log.info({ agentId, taskId }, "Sandbox lock released");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === "ConditionalCheckFailedException"
    ) {
      log.warn(
        { agentId, taskId },
        "Release failed — lock not owned by this task",
      );
      return;
    }
    throw err;
  }

  await wakeNextWaiter(ctx, agentId);
}

export async function updateLockStatus(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  status: "provisioning" | "in_use" | "available",
): Promise<void> {
  const table = ctx.resources.ddb.table;
  const ttl = Math.floor((Date.now() + LOCK_TTL_MS) / 1000);

  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        _et: "SandboxLock",
        pk: lockPk(agentId),
        sk: "LOCK",
        ownerTaskId: taskId,
        status,
        acquiredAt: new Date().toISOString(),
        ttl,
      },
      ConditionExpression: "ownerTaskId = :tid",
      ExpressionAttributeValues: { ":tid": taskId },
    }),
  );
  log.info({ agentId, taskId, status }, "Sandbox lock status updated");
}

export async function addSandboxWaiter(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<void> {
  const table = ctx.resources.ddb.table;
  const createdAt = new Date().toISOString();

  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        _et: "SandboxWaiter",
        pk: lockPk(agentId),
        sk: `WAITER#${createdAt}#${taskId}`,
        agentId,
        taskId,
        createdAt,
      },
    }),
  );
  log.info({ agentId, taskId }, "Added sandbox waiter");
}

async function wakeNextWaiter(
  ctx: ServiceContext,
  agentId: string,
): Promise<void> {
  const table = ctx.resources.ddb.table;

  const result = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": lockPk(agentId),
        ":prefix": "WAITER#",
      },
      Limit: 1,
      ScanIndexForward: true, // oldest first
    }),
  );

  const waiter = result.Items?.[0];
  if (!waiter) {
    log.info({ agentId }, "No waiters to wake");
    return;
  }

  // Delete the waiter record
  await table.getDocumentClient().send(
    new DeleteCommand({
      TableName: table.getName(),
      Key: { pk: waiter.pk, sk: waiter.sk },
    }),
  );

  const waiterTaskId = waiter.taskId as string;
  log.info({ agentId, waiterTaskId }, "Waking next sandbox waiter");

  // Enqueue work so the waiting task resumes
  await ctx.services.inbox.enqueueWork(ctx, agentId, {
    type: "sandbox_available",
    payload: { taskId: waiterTaskId },
  });
}
