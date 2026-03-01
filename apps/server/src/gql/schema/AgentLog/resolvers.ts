import type { AgentLogResolvers, QueryResolvers } from "../../resolverTypes.js";

const agentLogs: QueryResolvers["agentLogs"] = (_parent, { agentId }, ctx) =>
  ctx.services.agentLogs.getAgentLogs(ctx, agentId);

const taskLogs: QueryResolvers["taskLogs"] = (_parent, { taskId }, ctx) =>
  ctx.services.agentLogs.getTaskLogs(ctx, taskId);

const agent: AgentLogResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const agentLogResolvers = {
  Query: { agentLogs, taskLogs },
  AgentLog: { agent },
};
