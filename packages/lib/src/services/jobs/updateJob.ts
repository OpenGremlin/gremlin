import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import { patchUpdates } from "../../utils/patchUpdates.js";
import type { ServiceContext } from "../context.js";
import { recurrenceToCron } from "./recurrenceToCron.js";

interface UpdateJobInput {
  name?: string | null;
  description?: string | null;
  recurrence?: string | null;
  agentId?: string | null;
  timezone?: string | null;
  paused?: boolean | null;
}

export async function updateJob(
  ctx: ServiceContext,
  id: string,
  input: UpdateJobInput,
): Promise<AgentJobItem> {
  const updates: Record<string, unknown> = { id, ...patchUpdates(input) };

  // Recompute cron expression when recurrence changes
  if (input.recurrence != null) {
    const timezone =
      input.timezone ??
      (await ctx.services.jobs.getJob(ctx, id))?.timezone ??
      "UTC";
    updates.cronExpression = await recurrenceToCron(
      ctx,
      input.recurrence,
      timezone,
    );
  }

  const { Attributes } = await ctx.resources.ddb.entities.AgentJob.build(
    UpdateItemCommand,
  )
    .item(updates as { id: string })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Job ${id} not found`);

  // Recreate EventBridge schedule if cron or timezone changed
  if (input.recurrence != null || input.timezone != null) {
    ctx.services.inbox
      .deleteCronSchedule(id)
      .then(() => {
        if (Attributes.cronExpression) {
          return ctx.services.inbox.createCronSchedule({
            ...Attributes,
            cronExpression: Attributes.cronExpression,
          });
        }
      })
      .catch((err) =>
        ctx.log.error(
          { err, jobId: id, component: "jobs" },
          "Failed to update schedule",
        ),
      );
  }

  return Attributes;
}
