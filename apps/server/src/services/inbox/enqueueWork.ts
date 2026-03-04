import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

export type InboxItemType =
  | "user_message"
  | "run_task"
  | "scheduled_job"
  | "agent_self_followup"
  | "user_notification_reply";

export interface EnqueueInput {
  type: InboxItemType;
  payload: Record<string, unknown>;
}

export async function enqueueWork(
  ctx: ServiceContext,
  agentId: string,
  input: EnqueueInput,
) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(input.payload);

  const table = ctx.resources.ddb.table;
  const item = {
    _et: "InboxItem",
    pk: `AGENT_INBOX#${agentId}`,
    sk: `ITEM#${createdAt}#${id}`,
    gsi2pk: "INBOX_UNREAD",
    gsi2sk: createdAt,
    id,
    agentId,
    type: input.type,
    payload: payloadStr,
    isRead: false,
    createdAt,
  };

  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: item,
    }),
  );

  // Publish for real-time UI subscription
  ctx.resources.pubsub.publish(`inboxItemCreated:${agentId}`, {
    id,
    agentId,
    type: input.type,
    payload: payloadStr,
    isRead: false,
    createdAt,
  });

  // Ring the doorbell — in-process for now, SQS later.
  // Fire-and-forget: the drain loop handles errors internally.
  const { ringDoorbell } = await import("./consumer.js");
  ringDoorbell(ctx, agentId).catch((err) =>
    console.error(`[inbox] doorbell failed for agent ${agentId}:`, err),
  );

  return { id, createdAt };
}
