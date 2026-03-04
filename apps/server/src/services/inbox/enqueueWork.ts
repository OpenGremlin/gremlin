import type { SQSClient as SQSClientType } from "@aws-sdk/client-sqs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { logger } from "../../logger.js";
import type { ServiceContext } from "../context.js";

let _sqs: SQSClientType | undefined;
async function getSqsClient() {
  if (!_sqs) {
    const { SQSClient } = await import("@aws-sdk/client-sqs");
    _sqs = new SQSClient({});
  }
  return _sqs;
}

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

  // Ring the doorbell
  const queueUrl = process.env.DOORBELL_QUEUE_URL;
  if (queueUrl) {
    // SQS doorbell — deployed environment
    const { SendMessageCommand } = await import("@aws-sdk/client-sqs");
    const sqs = await getSqsClient();
    sqs
      .send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({ agentId }),
        }),
      )
      .catch((err) =>
        logger.error(
          { err, agentId, component: "inbox" },
          "SQS doorbell failed",
        ),
      );
  } else {
    // In-process doorbell — local development
    const { ringDoorbell } = await import("./consumer.js");
    ringDoorbell(ctx, agentId).catch((err) =>
      logger.error({ err, agentId, component: "inbox" }, "Doorbell failed"),
    );
  }

  return { id, createdAt };
}
