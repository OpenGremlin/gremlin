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

  const rangeCondition = args.after
    ? { gt: decodeCursor(args.after) }
    : args.before
      ? { lt: decodeCursor(args.before) }
      : undefined;

  const query = ctx.resources.ddb.chatTable
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({
      index: "gsi2",
      partition: "TASK_ALL",
      ...(rangeCondition && { range: rangeCondition }),
    })
    .options({ limit: fetchLimit, reverse: isBackward });

  const { Items } = await query.send();
  const items = [...(Items ?? [])];

  const hasMore = items.length > limit;
  if (hasMore) {
    items.length = limit;
  }

  if (isBackward) {
    items.reverse();
  }

  return buildConnection(items, args, hasMore);
}
