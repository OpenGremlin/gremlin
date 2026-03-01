import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { FeedItemItem } from "../../resources/ddb/schema/feedItem.js";
import type { ServiceContext } from "../context.js";

export async function getFeedItem(
  ctx: ServiceContext,
  id: string,
): Promise<FeedItemItem | null> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.FeedItem)
    .query({ partition: "FEED_ITEM", range: { eq: `FEED_ITEM#${id}` } })
    .send();

  return Items?.[0] ?? null;
}
