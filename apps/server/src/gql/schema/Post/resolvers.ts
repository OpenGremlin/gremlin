import type { PostItem } from "@opengremlin/lib/resources/ddb/schema/post.js";
import type { GremlinContext } from "../../context.js";

// ---------------------------------------------------------------------------
// Query resolvers
// ---------------------------------------------------------------------------

const posts = (
  _parent: unknown,
  {
    first,
    after,
    last,
    before,
  }: { first?: number; after?: string; last?: number; before?: string },
  ctx: GremlinContext,
) => ctx.services.posts.getPosts(ctx, { first, after, last, before });

// ---------------------------------------------------------------------------
// Field resolvers
// ---------------------------------------------------------------------------

const agent = async (parent: PostItem, _args: unknown, ctx: GremlinContext) => {
  if (!parent.agentId) return null;
  return ctx.loaders.agentLoader.load(parent.agentId).catch(() => null);
};

const attachments = (
  parent: PostItem,
  _args: unknown,
  ctx: GremlinContext,
) => ctx.services.posts.getPostAttachments(ctx, parent.id);

const node = (parent: { node: PostItem }) => parent.node;

// ---------------------------------------------------------------------------
// Subscription resolvers
// ---------------------------------------------------------------------------

const postCreated = {
  subscribe: (_parent: unknown, _args: unknown, ctx: GremlinContext) =>
    ctx.resources.pubsub.subscribe("postCreated"),
  resolve: (payload: PostItem) => payload,
};

export const postResolvers = {
  Query: { posts },
  Post: { agent, attachments },
  PostEdge: { node },
  Subscription: { postCreated },
};
