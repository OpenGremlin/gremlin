import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { ServiceContext } from "../context.js";
import {
  type AgentLogConnectionModel,
  buildConnection,
  decodeCursor,
  type PaginationArgs,
} from "./pagination.js";

export async function getTaskLogs(
  ctx: ServiceContext,
  taskId: string,
  args: PaginationArgs = {},
): Promise<AgentLogConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const fetchLimit = limit + 1;

  const partition = `LOG_TASK#${taskId}`;

  const rangeCondition = args.after
    ? { gt: decodeCursor(args.after) }
    : args.before
      ? { lt: decodeCursor(args.before) }
      : undefined;

  const query = ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.AgentLog)
    .query({
      index: "gsi1",
      partition,
      ...(rangeCondition && { range: rangeCondition }),
    })
    .options({ limit: fetchLimit, reverse: isBackward });

  const { Items } = await query.send();
  let items = (Items ?? []).filter((i) => !i.internal);

  const hasMore = items.length > limit;
  if (hasMore) {
    items = items.slice(0, limit);
  }

  if (isBackward) {
    items.reverse();
  }

  return buildConnection(items, args, hasMore);
}
