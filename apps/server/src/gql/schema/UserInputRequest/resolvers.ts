import { map, pipe } from "@graphql-yoga/subscription";
import type { GremlinContext } from "../../context.js";
import type {
  MutationResolvers,
  QueryResolvers,
  UserInputRequestResolvers,
} from "../../resolverTypes.js";

const userInputRequests: QueryResolvers["userInputRequests"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.userInputRequests.getUserInputRequests(ctx);

const resolveUserInputRequest: MutationResolvers["resolveUserInputRequest"] = (
  _parent,
  { id, action },
  ctx,
) => ctx.services.userInputRequests.resolveUserInputRequest(ctx, id, action);

const dismissUserInputRequest: MutationResolvers["dismissUserInputRequest"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.userInputRequests.dismissUserInputRequest(ctx, id);

const agent: UserInputRequestResolvers["agent"] = async (
  parent,
  _args,
  ctx,
) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const pendingItemsUpdated = {
  subscribe: (_parent: unknown, _args: unknown, ctx: GremlinContext) =>
    pipe(
      ctx.resources.pubsub.subscribe("pendingItemsUpdated"),
      map(() => true),
    ),
  resolve: () => true,
};

export const userInputRequestResolvers = {
  Query: { userInputRequests },
  Mutation: { resolveUserInputRequest, dismissUserInputRequest },
  Subscription: { pendingItemsUpdated },
  UserInputRequest: { agent },
};
