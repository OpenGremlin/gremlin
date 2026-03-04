import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { logger } from "../../logger.js";
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

  // Delete EventBridge schedule
  ctx.services.inbox
    .deleteCronSchedule(id)
    .catch((err) =>
      logger.error(
        { err, jobId: id, component: "jobs" },
        "Failed to delete schedule",
      ),
    );

  return job;
}
