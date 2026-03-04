import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createLogger } from "../logger.js";

/**
 * Lambda invoked by EventBridge Scheduler for:
 * - Cron jobs (scheduled_job)
 * - Agent self-follow-ups (agent_self_followup)
 *
 * Writes an inbox item to DDB and rings the SQS doorbell.
 */

const logger = createLogger("gremlin-schedule-target");
const ddb = new DynamoDBClient({});
const sqs = new SQSClient({});
const TABLE_NAME = process.env.TABLE_NAME ?? "";
const QUEUE_URL = process.env.QUEUE_URL ?? "";

interface ScheduleEvent {
  type: "scheduled_job" | "agent_self_followup";
  agentId: string;
  payload: Record<string, unknown>;
}

export async function handler(event: ScheduleEvent) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(event.payload);

  // Write inbox item and ring doorbell concurrently
  await Promise.all([
    ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          _et: { S: "InboxItem" },
          pk: { S: `AGENT_INBOX#${event.agentId}` },
          sk: { S: `ITEM#${createdAt}#${id}` },
          gsi2pk: { S: "INBOX_UNREAD" },
          gsi2sk: { S: createdAt },
          id: { S: id },
          agentId: { S: event.agentId },
          type: { S: event.type },
          payload: { S: payloadStr },
          isRead: { BOOL: false },
          createdAt: { S: createdAt },
        },
      }),
    ),
    sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ agentId: event.agentId }),
      }),
    ),
  ]);

  logger.info(
    { type: event.type, agentId: event.agentId, inboxItemId: id },
    "Enqueued inbox item",
  );

  return { statusCode: 200, id };
}
