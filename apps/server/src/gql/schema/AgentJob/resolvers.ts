import { CronExpressionParser } from "cron-parser";
import type {
  AgentJobResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const agentJobs: QueryResolvers["agentJobs"] = (_parent, _args, ctx) =>
  ctx.services.jobs.getJobs(ctx);

const agentJob: QueryResolvers["agentJob"] = (_parent, { id }, ctx) =>
  ctx.services.jobs.getJob(ctx, id);

const updateJobStatus: MutationResolvers["updateJobStatus"] = (
  _parent,
  { id, status },
  ctx,
) => ctx.services.jobs.updateJobStatus(ctx, id, status);

const updateAgentJob: MutationResolvers["updateAgentJob"] = (
  _parent,
  { id, input },
  ctx,
) => ctx.services.jobs.updateJob(ctx, id, input);

const createAgentJob: MutationResolvers["createAgentJob"] = (
  _parent,
  { input },
  ctx,
) => ctx.services.jobs.createJob(ctx, input);

const deleteAgentJob: MutationResolvers["deleteAgentJob"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.jobs.deleteJob(ctx, id);

const agent: AgentJobResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const tasks: AgentJobResolvers["tasks"] = async (parent, _args, ctx) => {
  const agentTasks = await ctx.loaders.tasksByAgentLoader.load(parent.agentId);
  return agentTasks.filter((t) => t.originJobId === parent.id);
};

const nextRun: AgentJobResolvers["nextRun"] = async (parent) => {
  if (!parent.cronExpression) return null;
  try {
    const expr = CronExpressionParser.parse(parent.cronExpression, {
      currentDate: new Date(),
      tz: parent.timezone,
    });
    return expr.next().toDate().toISOString();
  } catch {
    return null;
  }
};

export const agentJobResolvers = {
  Query: { agentJobs, agentJob },
  Mutation: { updateJobStatus, updateAgentJob, createAgentJob, deleteAgentJob },
  AgentJob: { agent, tasks, nextRun },
};
