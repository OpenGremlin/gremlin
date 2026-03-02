import { Repeater } from "@graphql-yoga/subscription";
import type { AgentItem } from "../../../resources/ddb/schema/agent.js";
import { AgentStatus } from "../../resolverTypes.js";
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

const updateAgentStatus: MutationResolvers["updateAgentStatus"] = (
  _parent,
  { id, status },
  ctx,
) => ctx.services.agents.updateAgentStatus(ctx, id, status);

const NON_TERMINAL = new Set(["PENDING", "RUNNING", "WAITING"]);

const status: AgentResolvers["status"] = async (parent, _args, ctx) => {
  // If status was pre-computed (e.g. by resolveAgentStatus), use it directly
  // to avoid stale GSI reads from DynamoDB eventual consistency.
  if ((parent as Record<string, unknown>).status) {
    return (parent as Record<string, unknown>).status as AgentStatus;
  }
  if (parent.blocked) return AgentStatus.Blocked;
  const tasks = await ctx.services.tasks.getTasksByAgent(ctx, parent.id);
  const hasActive = tasks.some((t) => NON_TERMINAL.has(t.status));
  return hasActive ? AgentStatus.Active : AgentStatus.Idle;
};

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
  Mutation: { updateAgent, updateAgentStatus },
  Agent: { status, imageUrl },
  Subscription: { agentUpdated, agentsUpdated },
};
