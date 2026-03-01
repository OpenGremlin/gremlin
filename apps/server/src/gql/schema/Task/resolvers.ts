import type { TaskResolvers, TaskEdgeResolvers, QueryResolvers } from "../../resolverTypes.js";

const tasks: QueryResolvers["tasks"] = (_parent, { first, after, last, before }, ctx) =>
  ctx.services.tasks.getAllTasks(ctx, { first, after, last, before });

const task: QueryResolvers["task"] = (_parent, { id }, ctx) =>
  ctx.services.tasks.getTask(ctx, id);

const agent: TaskResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const logs: TaskResolvers["logs"] = (parent, { first, after, last, before }, ctx) =>
  ctx.services.agentLogs.getTaskLogs(ctx, parent.id, { first, after, last, before });

const node: TaskEdgeResolvers["node"] = (parent) => parent.node;

export const taskResolvers = {
  Query: { tasks, task },
  Task: { agent, logs },
  TaskEdge: { node },
};
