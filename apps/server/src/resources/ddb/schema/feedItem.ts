import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const FeedItemEntity = new Entity({
  name: "FeedItem",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string().key(),
    title: string(),
    summary: string(),
    body: string(),
    category: string(),
    completedAt: string().key(),
  }),
  computeKey: ({ id, agentId, completedAt }) => ({
    pk: "FEED_ITEM",
    sk: `FEED_ITEM#${id}`,
    gsi1pk: `FEED_AGENT#${agentId}`,
    gsi1sk: completedAt,
  }),
});

export type FeedItemItem = FormattedItem<typeof FeedItemEntity>;
