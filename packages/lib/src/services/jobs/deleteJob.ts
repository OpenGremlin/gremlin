import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

export async function deleteJob(
  ctx: ServiceContext,
  id: string,
): Promise<AgentJobItem> {
  const job = await ctx.services.jobs.getJob(ctx, id);
  if (!job) throw new Error(`Job ${id} not found`);

  await ctx.resources.ddb.entities.AgentJob.build(DeleteItemCommand)
    .key({ id })
    .send();

  // Delete EventBridge schedule (best-effort — may not exist)
  await ctx.services.inbox.deleteCronSchedule(id).catch(() => {});

  return job;
}
