import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { PostItem } from "../../resources/ddb/schema/post.js";
import type { ServiceContext } from "../context.js";
import {
  buildConnection,
  decodeCursor,
  type PaginationArgs,
  type Connection,
} from "../pagination.js";

export type PostConnectionModel = Connection<PostItem>;

export async function getPosts(
  ctx: ServiceContext,
  args: PaginationArgs = {},
): Promise<PostConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 20;
  const fetchLimit = limit + 1;

  const rangeCondition = args.after
    ? { gt: decodeCursor(args.after) }
    : args.before
      ? { lt: decodeCursor(args.before) }
      : undefined;

  const query = ctx.resources.ddb.chatTable
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Post)
    .query({
      index: "gsi2",
      partition: "POST_ALL",
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
