import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import pino from "pino";

/**
 * Sweeper Lambda — runs every 3 minutes via EventBridge rule.
 * Queries GSI2 for unread inbox items older than 10 minutes
 * and re-rings doorbells for their agents.
 */

const logger = pino({ base: { service: "gremlin-sweeper" } });
const ddb = new DynamoDBClient({});
const sqs = new SQSClient({});
const TABLE_NAME = process.env.TABLE_NAME ?? "";
const QUEUE_URL = process.env.QUEUE_URL ?? "";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function handler() {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  const { Items } = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk AND gsi2sk < :cutoff",
      ExpressionAttributeValues: {
        ":pk": { S: "INBOX_UNREAD" },
        ":cutoff": { S: cutoff },
      },
    }),
  );

  if (!Items || Items.length === 0) {
    logger.info("No stale inbox items");
    return { statusCode: 200, stale: 0 };
  }

  // Extract unique agent IDs from raw DDB items
  const agentIds = [
    ...new Set(
      Items.map((item) => item.agentId?.S).filter(Boolean) as string[],
    ),
  ];

  logger.info(
    { staleCount: Items.length, agentCount: agentIds.length },
    "Re-ringing doorbells for stale items",
  );

  await Promise.all(
    agentIds.map((agentId) =>
      sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({ agentId }),
        }),
      ),
    ),
  );

  return { statusCode: 200, stale: Items.length, agents: agentIds.length };
}
