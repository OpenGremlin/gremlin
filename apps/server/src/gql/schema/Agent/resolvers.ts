import { Repeater } from "@graphql-yoga/subscription";
import type { AgentItem } from "../../../resources/ddb/schema/agent.js";
import type { GremlinContext } from "../../context.js";
import type {
  AgentResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const agents: QueryResolvers["agents"] = (_parent, _args, ctx) =>
  ctx.services.agents.getAgents(ctx);

const agent: QueryResolvers["agent"] = (_parent, { id }, ctx) =>
  ctx.services.agents.getAgent(ctx, id);

const updateAgent: MutationResolvers["updateAgent"] = (
  _parent,
  { id, input },
  ctx,
) => ctx.services.agents.updateAgent(ctx, id, input);

const imageUrl: AgentResolvers["imageUrl"] = (parent, args, ctx) =>
  ctx.services.media.buildMediaUrl(ctx.mediaCdnUrl, parent.avatar, args.width);

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

export const agentResolvers = {
  Query: { agents, agent },
  Mutation: { updateAgent },
  Agent: { imageUrl },
  Subscription: { agentUpdated, agentsUpdated },
};
