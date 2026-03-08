import {
  type AttributeValue,
  DynamoDBClient,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createLogger } from "@gremlin/lib/logger.js";

/**
 * Sweeper Lambda — runs every 3 minutes via EventBridge rule.
 * Queries GSI2 for unread inbox items older than 10 minutes
 * and re-rings doorbells for their agents.
 */

const logger = createLogger("gremlin-sweeper");
const ddb = new DynamoDBClient({});
const sqs = new SQSClient({});
const TABLE_NAME = process.env.TABLE_NAME ?? "";
const QUEUE_URL = process.env.QUEUE_URL ?? "";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function handler() {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  // Paginate GSI2 query, only fetching agentId
  const agentIds = new Set<string>();
  let exclusiveStartKey: Record<string, AttributeValue> | undefined;

  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :pk AND gsi2sk < :cutoff",
        ExpressionAttributeValues: {
          ":pk": { S: "INBOX_UNREAD" },
          ":cutoff": { S: cutoff },
        },
        ProjectionExpression: "agentId",
        ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
      }),
    );

    for (const item of result.Items ?? []) {
      if (item.agentId?.S) agentIds.add(item.agentId.S);
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  if (agentIds.size === 0) {
    logger.info("No stale inbox items");
    return { statusCode: 200, stale: 0 };
  }

  logger.info(
    { agentCount: agentIds.size },
    "Re-ringing doorbells for stale items",
  );

  await Promise.all(
    [...agentIds].map((agentId) =>
      sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({ agentId }),
        }),
      ),
    ),
  );

  return { statusCode: 200, agents: agentIds.size };
}
