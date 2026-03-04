import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { ServiceContext } from "../context.js";
import {
  buildConnection,
  type PaginationArgs,
  type TaskConnectionModel,
} from "./pagination.js";

/**
 * Decode a task cursor. Handles both old format (just createdAt)
 * and new format (createdAt#id) by extracting the id portion,
 * which maps to the SK format `TASK#<id>`.
 */
function decodeTaskCursor(cursor: string): string {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  const hashIdx = decoded.indexOf("#");
  // New format: createdAt#id → use id
  if (hashIdx > 0) return decoded.slice(hashIdx + 1);
  // Old format: just createdAt (shouldn't happen for tasks, but safe fallback)
  return decoded;
}

export async function getAllTasks(
  ctx: ServiceContext,
  args: PaginationArgs = {},
): Promise<TaskConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const fetchLimit = limit + 1;

  const partition = "TASK";

  const rangeCondition = args.after
    ? { gt: `TASK#${decodeTaskCursor(args.after)}` }
    : args.before
      ? { lt: `TASK#${decodeTaskCursor(args.before)}` }
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
