import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { JobStatus } from "../../enums.js";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

export async function updateJobStatus(
  ctx: ServiceContext,
  id: string,
  status: JobStatus,
): Promise<AgentJobItem> {
  const { Attributes } = await ctx.resources.ddb.entities.AgentJob.build(
    UpdateItemCommand,
  )
    .item({ id, status })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Job ${id} not found`);

  // Create or delete EventBridge schedule based on new status
  if (status === "PAUSED") {
    ctx.services.inbox
      .deleteCronSchedule(id)
      .catch((err) =>
        ctx.log.error(
          { err, jobId: id, component: "jobs" },
          "Failed to delete schedule for paused job",
        ),
      );
  } else if (Attributes.cronExpression) {
    ctx.services.inbox
      .createCronSchedule({
        ...Attributes,
        cronExpression: Attributes.cronExpression,
      })
      .catch((err) =>
        ctx.log.error(
          { err, jobId: id, component: "jobs" },
          "Failed to create schedule for resumed job",
        ),
      );
  }

  return Attributes;
}
