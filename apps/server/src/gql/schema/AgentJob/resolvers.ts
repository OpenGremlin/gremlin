import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const agentJobs: QueryResolvers["agentJobs"] = (_parent, _args, ctx) =>
  ctx.services.jobs.getJobs(ctx);

const agentJob: QueryResolvers["agentJob"] = (_parent, { id }, ctx) =>
  ctx.services.jobs.getJob(ctx, id);

const updateJobStatus: MutationResolvers["updateJobStatus"] = (
  _parent,
  { id, status },
  ctx,
) => ctx.services.jobs.updateJobStatus(ctx, id, status);

export const agentJobResolvers = {
  Query: { agentJobs, agentJob },
  Mutation: { updateJobStatus },
};
