import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { ServiceContext } from "../context.js";
import {
  type TaskConnectionModel,
  type PaginationArgs,
  buildConnection,
  decodeCursor,
} from "./pagination.js";

export async function getAllTasks(
  ctx: ServiceContext,
  args: PaginationArgs = {},
): Promise<TaskConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const fetchLimit = limit + 1;

  const partition = "TASK";

  let query;
  if (args.after) {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.Task)
      .query({ partition, range: { gt: `TASK#${decodeCursor(args.after)}` } })
      .options({ limit: fetchLimit, reverse: isBackward });
  } else if (args.before) {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.Task)
      .query({ partition, range: { lt: `TASK#${decodeCursor(args.before)}` } })
      .options({ limit: fetchLimit, reverse: isBackward });
  } else {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.Task)
      .query({ partition })
      .options({ limit: fetchLimit, reverse: isBackward });
  }

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
