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

const triggerJob: MutationResolvers["triggerJob"] = async (
  _parent,
  { id },
  ctx,
) => {
  const job = await ctx.services.jobs.getJob(ctx, id);
  if (!job) throw new Error("Job not found");
  await ctx.services.inbox.enqueueWork(ctx, job.agentId, {
    type: "scheduled_job",
    payload: { jobId: id, triggerTimeMs: Date.now() },
  });
  return true;
};

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

const paused: AgentJobResolvers["paused"] = (parent) =>
  parent.paused ?? false;

export const agentJobResolvers = {
  Query: { agentJobs, agentJob },
  Mutation: {
    updateAgentJob,
    createAgentJob,
    deleteAgentJob,
    triggerJob,
  },
  AgentJob: { agent, tasks, nextRun, paused },
};
