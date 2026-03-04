import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { ServiceContext } from "../context.js";
import {
  buildConnection,
  decodeCursor,
  type PaginationArgs,
  type TaskConnectionModel,
} from "./pagination.js";

export async function getAllTasks(
  ctx: ServiceContext,
  args: PaginationArgs = {},
): Promise<TaskConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const fetchLimit = limit + 1;

  const partition = "TASK";

  const rangeCondition = args.after
    ? { gt: `TASK#${decodeCursor(args.after)}` }
    : args.before
      ? { lt: `TASK#${decodeCursor(args.before)}` }
      : undefined;

  const query = ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({
      partition,
      ...(rangeCondition && { range: rangeCondition }),
    })
    .options({ limit: fetchLimit, reverse: isBackward });

  const { Items } = await query.send();
  let items = Items ?? [];

  const hasMore = items.length > limit;
  if (hasMore) {
    items = items.slice(0, limit);
  }

  if (isBackward) {
    items.reverse();
  }

  return buildConnection(items, args, hasMore);
}
