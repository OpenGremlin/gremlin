import type { TaskResolvers, QueryResolvers } from "../../resolverTypes.js";

const tasks: QueryResolvers["tasks"] = (_parent, { agentId }, ctx) =>
  ctx.services.tasks.getTasks(ctx, agentId);

const task: QueryResolvers["task"] = (_parent, { id }, ctx) =>
  ctx.services.tasks.getTask(ctx, id);

const agent: TaskResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const logs: TaskResolvers["logs"] = (parent, _args, ctx) =>
  ctx.services.agentLogs.getTaskLogs(ctx, parent.id);

export const taskResolvers = {
  Query: { tasks, task },
  Task: { agent, logs },
};
