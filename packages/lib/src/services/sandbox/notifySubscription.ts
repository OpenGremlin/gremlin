import {
  BatchWriteCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { InboxItemType } from "../inbox/enqueueWork.js";

const log = createLogger("notify:subscription");

function subPk(agentId: string) {
  return `NOTIFY_SUB#${agentId}`;
}

/**
 * Subscribe a task to an agent-level event (e.g. "sandbox_available").
 * When the event fires, every subscriber gets an inbox item + SQS knock.
 */
export async function subscribe(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  eventType: string,
): Promise<void> {
  const table = ctx.resources.ddb.table;

  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        _et: "NotifyHookSubscription",
        pk: subPk(agentId),
        sk: `${eventType}#${taskId}`,
        agentId,
        taskId,
        eventType,
        createdAt: new Date().toISOString(),
      },
    }),
  );

  log.info({ agentId, taskId, eventType }, "Subscribed to notify event");
}

/**
 * Fan out an event to all subscribers. For each subscriber:
 *   1. Enqueue an inbox item with the subscriber's taskId
 *   2. Ring the SQS doorbell
 * Then delete all matched subscriptions.
 */
export async function fanOut(
  ctx: ServiceContext,
  agentId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const table = ctx.resources.ddb.table;

  const result = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": subPk(agentId),
        ":prefix": `${eventType}#`,
      },
    }),
  );

  const subscribers = result.Items ?? [];
  if (subscribers.length === 0) {
    log.info({ agentId, eventType }, "No subscribers for event");
    return 0;
  }

  log.info(
    { agentId, eventType, count: subscribers.length },
    "Fanning out to subscribers",
  );

  // Enqueue inbox items for each subscriber
  const taskIds = subscribers.map((sub) => sub.taskId as string);
  log.info({ agentId, eventType, taskIds }, "Notifying subscribers");

  await Promise.all(
    subscribers.map(async (sub) => {
      const taskId = sub.taskId as string;
      try {
        await ctx.services.inbox.enqueueWork(ctx, agentId, {
          type: eventType as InboxItemType,
          payload: { ...payload, taskId },
        });
        log.info({ agentId, eventType, taskId }, "Enqueued inbox item");
      } catch (err) {
        log.error(
          { agentId, eventType, taskId, error: (err as Error).message },
          "Failed to enqueue inbox item for subscriber",
        );
      }
    }),
  );

  // Delete subscriptions in batches of 25
  for (let i = 0; i < subscribers.length; i += 25) {
    const batch = subscribers.slice(i, i + 25);
    try {
      await table.getDocumentClient().send(
        new BatchWriteCommand({
          RequestItems: {
            [table.getName()]: batch.map((sub) => ({
              DeleteRequest: {
                Key: { pk: sub.pk, sk: sub.sk },
              },
            })),
          },
        }),
      );
    } catch (err) {
      log.error(
        {
          agentId,
          eventType,
          batchSize: batch.length,
          error: (err as Error).message,
        },
        "Failed to delete subscriptions batch",
      );
    }
  }

  log.info(
    { agentId, eventType, count: subscribers.length },
    "Fan-out complete, subscriptions cleaned up",
  );
  return subscribers.length;
}
