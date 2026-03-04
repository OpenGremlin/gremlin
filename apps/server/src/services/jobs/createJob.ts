import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";
import { recurrenceToCron } from "./recurrenceToCron.js";

interface CreateJobInput {
  name: string;
  description: string;
  recurrence: string;
  timezone: string;
  agentId?: string | null;
}

export async function createJob(
  ctx: ServiceContext,
  input: CreateJobInput,
): Promise<AgentJobItem> {
  const id = crypto.randomUUID();
  const cronExpression = await recurrenceToCron(
    ctx,
    input.recurrence,
    input.timezone,
  );

  const item = {
    id,
    name: input.name,
    description: input.description,
    recurrence: input.recurrence,
    cronExpression,
    timezone: input.timezone,
    agentId: input.agentId ?? "clawd",
    status: "IDLE" as const,
    lastRun: null,
  };

  await ctx.resources.ddb.entities.AgentJob.build(PutItemCommand)
    .item(item)
    .send();

  // Create EventBridge cron schedule
  if (cronExpression) {
    ctx.services.inbox
      .createCronSchedule(item)
      .catch((err) =>
        console.error(`[jobs] Failed to create schedule for job ${id}:`, err),
      );
  }

  return item;
}
