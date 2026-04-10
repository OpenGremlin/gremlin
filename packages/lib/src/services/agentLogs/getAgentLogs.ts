import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";
import type { ServiceContext } from "../context.js";
import { getChatLane } from "./getChatLane.js";
import {
  type AgentLogConnectionModel,
  buildConnection,
  decodeCursor,
  type PaginationArgs,
} from "./pagination.js";

export async function getAgentLogs(
  ctx: ServiceContext,
  agentId: string,
  args: PaginationArgs = {},
): Promise<AgentLogConnectionModel> {
  const chatLane = await getChatLane(ctx, agentId, "main");
  return queryLogs(ctx, `LOG_AGENT#${agentId}`, args, chatLane?.clearedAt);
}

/**
 * Paginate agent logs on a GSI1 partition, filtering out internal
 * tool entries in application code (not DDB) so that `hasMore` and
 * cursor math are always correct.
 */
export async function queryLogs(
  ctx: ServiceContext,
  partition: string,
  args: PaginationArgs,
  clearedAt?: string,
): Promise<AgentLogConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const need = limit + 1; // one extra to determine hasMore

  const rangeCondition = args.after
    ? clearedAt && clearedAt > decodeCursor(args.after)
      ? { gte: clearedAt }
      : { gt: decodeCursor(args.after) }
    : args.before
      ? { lt: decodeCursor(args.before) }
      : clearedAt
        ? { gte: clearedAt }
        : undefined;

  const collected: AgentLogItem[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  while (collected.length < need) {
    const query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.AgentLog)
      .query({
        index: "gsi1",
        partition,
        ...(rangeCondition && { range: rangeCondition }),
      })
      .options({
        limit: need * 2,
        reverse: isBackward,
        ...(exclusiveStartKey && { exclusiveStartKey }),
      });

    const result = await query.send();
    const page = result.Items ?? [];

    for (const item of page) {
      if (item.internal) continue;
      // When paginating backward past the clearedAt boundary, stop collecting
      if (clearedAt && item.createdAt < clearedAt) continue;
      collected.push(item);
      if (collected.length >= need) break;
    }

    if (!result.LastEvaluatedKey) break;
    exclusiveStartKey = result.LastEvaluatedKey;
  }

  const hasMore = collected.length > limit;
  const items = hasMore ? collected.slice(0, limit) : collected;

  if (isBackward) {
    items.reverse();
  }

  return buildConnection(items, args, hasMore);
}
