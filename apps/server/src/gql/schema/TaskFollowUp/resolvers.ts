import type {
  MutationResolvers,
  QueryResolvers,
  TaskFollowUpResolvers,
} from "../../resolverTypes.js";

const activeFollowUps: QueryResolvers["activeFollowUps"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.taskFollowUps.getActiveFollowUps(ctx);

const taskFollowUps: QueryResolvers["taskFollowUps"] = (
  _parent,
  { taskId },
  ctx,
) => ctx.services.taskFollowUps.getTaskFollowUps(ctx, taskId);

const deactivateFollowUp: MutationResolvers["deactivateFollowUp"] = async (
  _parent,
  { id },
  ctx,
) => {
  await ctx.services.taskFollowUps.deactivateFollowUp(ctx, id);
  return null;
};

const task: TaskFollowUpResolvers["task"] = async (parent, _args, ctx) => {
  const t = await ctx.services.tasks.getTask(ctx, parent.taskId);
  if (!t) throw new Error(`Task ${parent.taskId} not found`);
  return t;
};

const agent: TaskFollowUpResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const taskFollowUpResolvers = {
  Query: { activeFollowUps, taskFollowUps },
  Mutation: { deactivateFollowUp },
  TaskFollowUp: { task, agent },
};
