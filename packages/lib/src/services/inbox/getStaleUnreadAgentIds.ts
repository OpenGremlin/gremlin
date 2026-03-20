import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Query GSI2 for unread inbox items older than the stale threshold
 * and return the unique set of { agentId, lane } pairs that have stuck work.
 */
export async function getStaleUnreadTargets(
  ctx: ServiceContext,
): Promise<Array<{ agentId: string; lane: string }>> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  const table = ctx.resources.ddb.table;
  const seen = new Set<string>();
  const targets: Array<{ agentId: string; lane: string }> = [];

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
        ProjectionExpression: "agentId, lane",
        ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
      }),
    );

    for (const item of result.Items ?? []) {
      const agentId = item.agentId as string | undefined;
      const lane = (item.lane as string | undefined) ?? "main";
      if (!agentId) continue;

      const key = `${agentId}#${lane}`;
      if (!seen.has(key)) {
        seen.add(key);
        targets.push({ agentId, lane });
      }
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return targets;
}
