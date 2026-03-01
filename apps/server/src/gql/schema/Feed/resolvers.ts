import type {
  FeedItemResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const feedItems: QueryResolvers["feedItems"] = (_parent, _args, ctx) =>
  ctx.services.feed.getFeedItems(ctx);

const feedItem: QueryResolvers["feedItem"] = (_parent, { id }, ctx) =>
  ctx.services.feed.getFeedItem(ctx, id);

const agent: FeedItemResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const feedResolvers = {
  Query: { feedItems, feedItem },
  FeedItem: { agent },
};
