import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Query GSI2 for unread inbox items older than the stale threshold
 * and return the unique set of agent IDs that have stuck work.
 */
export async function getStaleUnreadAgentIds(
  ctx: ServiceContext,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  const table = ctx.resources.ddb.table;
  const agentIds = new Set<string>();

  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await table.getDocumentClient().send(
      new QueryCommand({
        TableName: table.getName(),
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :pk AND gsi2sk < :cutoff",
        ExpressionAttributeValues: {
          ":pk": "INBOX_UNREAD",
          ":cutoff": cutoff,
        },
        ProjectionExpression: "agentId",
        ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
      }),
    );

    for (const item of result.Items ?? []) {
      if (item.agentId) agentIds.add(item.agentId as string);
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return [...agentIds];
}
