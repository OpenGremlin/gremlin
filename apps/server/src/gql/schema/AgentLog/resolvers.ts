import type {
  AgentLogResolvers,
  AgentLogEdgeResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const agentLogs: QueryResolvers["agentLogs"] = (
  _parent,
  { agentId, first, after, last, before },
  ctx,
) => ctx.services.agentLogs.getAgentLogs(ctx, agentId, { first, after, last, before });

const taskLogs: QueryResolvers["taskLogs"] = (
  _parent,
  { taskId, first, after, last, before },
  ctx,
) => ctx.services.agentLogs.getTaskLogs(ctx, taskId, { first, after, last, before });

const agent: AgentLogResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const node: AgentLogEdgeResolvers["node"] = (parent) => parent.node;

export const agentLogResolvers = {
  Query: { agentLogs, taskLogs },
  AgentLog: { agent },
  AgentLogEdge: { node },
};
