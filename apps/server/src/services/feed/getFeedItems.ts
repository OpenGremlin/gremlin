import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { FeedItemItem } from "../../resources/ddb/schema/feedItem.js";
import type { ServiceContext } from "../context.js";

export async function getFeedItems(
  ctx: ServiceContext,
): Promise<FeedItemItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.FeedItem)
    .query({ partition: "FEED_ITEM" })
    .send();

  return Items ?? [];
}
