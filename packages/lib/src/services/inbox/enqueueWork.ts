import type { SQSClient as SQSClientType } from "@aws-sdk/client-sqs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

let _sqs: SQSClientType | undefined;
async function getSqsClient() {
  if (!_sqs) {
    const { SQSClient } = await import("@aws-sdk/client-sqs");
    _sqs = new SQSClient({
      ...(process.env.LOCALSTACK_ENDPOINT && {
        endpoint: process.env.LOCALSTACK_ENDPOINT,
      }),
    });
  }
  return _sqs;
}

export type InboxItemType =
  | "user_message"
  | "user_task_message"
  | "run_task"
  | "scheduled_job"
  | "agent_self_followup"
  | "user_input_request_reply"
  | "core_memory_review"
  | "resume_task";

export interface EnqueueInput {
  type: InboxItemType;
  payload: Record<string, unknown>;
}

export async function enqueueWork(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
  input: EnqueueInput,
) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(input.payload);

  const table = ctx.resources.ddb.table;
  const item = {
    _et: "InboxItem",
    pk: `AGENT_INBOX#${agentId}#${lane}`,
    sk: `ITEM#${createdAt}#${id}`,
    gsi2pk: "INBOX_UNREAD",
    gsi2sk: createdAt,
    id,
    agentId,
    lane,
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

  ctx.log.info(
    { agentId, lane, inboxItemId: id, type: input.type },
    "Enqueued inbox item",
  );

  // Ring the doorbell via SQS
  const queueUrl = process.env.DOORBELL_SQS_URL;
  if (queueUrl) {
    const { SendMessageCommand } = await import("@aws-sdk/client-sqs");
    const sqs = await getSqsClient();
    sqs
      .send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({ agentId, lane }),
        }),
      )
      .catch((err) =>
        ctx.log.error(
          { err, agentId, component: "inbox" },
          "SQS doorbell failed",
        ),
      );
  }

  return { id, createdAt };
}
