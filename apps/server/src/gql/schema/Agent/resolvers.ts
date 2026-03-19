import { Repeater } from "@graphql-yoga/subscription";
import type { AgentItem } from "@gremlin/lib/resources/ddb/schema/agent.js";
import type { GremlinContext } from "../../context.js";
import type {
  AgentResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";
import { avatarPathById } from "../Avatar/resolvers.js";

const agents: QueryResolvers["agents"] = (_parent, _args, ctx) =>
  ctx.services.agents.getAgents(ctx);

const agent: QueryResolvers["agent"] = (_parent, { id }, ctx) =>
  ctx.services.agents.getAgent(ctx, id);

const createAgent: MutationResolvers["createAgent"] = (
  _parent,
  { input },
  ctx,
) => ctx.services.agents.createAgent(ctx, input);

const updateAgent: MutationResolvers["updateAgent"] = (
  _parent,
  { id, input },
  ctx,
) =>
  ctx.services.agents.updateAgent(
    ctx,
    id,
    input as Parameters<typeof ctx.services.agents.updateAgent>[2],
  );

const retireAgent: MutationResolvers["retireAgent"] = (_parent, { id }, ctx) =>
  ctx.services.agents.retireAgent(ctx, id);

const unretireAgent: MutationResolvers["unretireAgent"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.agents.unretireAgent(ctx, id);

const imageUrl: AgentResolvers["imageUrl"] = (parent, args, ctx) => {
  const path = avatarPathById(parent.avatar) ?? parent.avatar;
  return ctx.services.media.buildMediaUrl(ctx.mediaBaseUrl, path, args.width);
};

const agentUpdated = {
  subscribe: (
    _parent: unknown,
    { agentId }: { agentId: string },
    ctx: GremlinContext,
  ) => ctx.resources.pubsub.subscribe(`agentUpdated:${agentId}`),
  resolve: (payload: AgentItem) => payload,
};

const agentsUpdated = {
  subscribe: (
    _parent: unknown,
    { agentIds }: { agentIds: string[] },
    ctx: GremlinContext,
  ) =>
    Repeater.merge(
      agentIds.map((id) =>
        ctx.resources.pubsub.subscribe(`agentUpdated:${id}`),
      ),
    ),
  resolve: (payload: AgentItem) => payload,
};

const retired: AgentResolvers["retired"] = (parent) => parent.retired ?? false;

export const agentResolvers = {
  Query: { agents, agent },
  Mutation: { createAgent, updateAgent, retireAgent, unretireAgent },
  Agent: { imageUrl, retired },
  Subscription: { agentUpdated, agentsUpdated },
};
