import type {
  AgentResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const agents: QueryResolvers["agents"] = (_parent, _args, ctx) =>
  ctx.services.agents.getAgents(ctx);

const agent: QueryResolvers["agent"] = (_parent, { id }, ctx) =>
  ctx.services.agents.getAgent(ctx, id);

const updateAgentStatus: MutationResolvers["updateAgentStatus"] = (
  _parent,
  { id, status },
  ctx,
) => ctx.services.agents.updateAgentStatus(ctx, id, status);

const imageUrl: AgentResolvers["imageUrl"] = (parent, args, ctx) =>
  ctx.services.media.buildMediaUrl(ctx.mediaCdnUrl, parent.avatar, args.width);

export const agentResolvers = {
  Query: { agents, agent },
  Mutation: { updateAgentStatus },
  Agent: { imageUrl },
};
