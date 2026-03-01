import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

interface UpdateJobInput {
  name?: string | null;
  description?: string | null;
  recurrence?: string | null;
  agentId?: string | null;
}

/** Mock LLM: converts natural-language recurrence to a cron expression. */
function recurrenceToCron(recurrence: string): string {
  const lower = recurrence.toLowerCase();
  if (lower.includes("daily") || lower.includes("every day"))
    return "0 9 * * *";
  if (lower.includes("hourly") || lower.includes("every hour"))
    return "0 * * * *";
  if (lower.includes("weekly") || lower.includes("every week"))
    return "0 9 * * 1";
  if (lower.includes("monthly") || lower.includes("every month"))
    return "0 9 1 * *";
  if (lower.includes("every 15 min")) return "*/15 * * * *";
  if (lower.includes("every 30 min")) return "*/30 * * * *";
  throw new Error(
    `Could not parse recurrence: "${recurrence}". Try something like "every day" or "every hour".`,
  );
}

export async function updateJob(
  ctx: ServiceContext,
  id: string,
  input: UpdateJobInput,
): Promise<AgentJobItem> {
  const updates: Record<string, unknown> = { id };

  if (input.name != null) updates.name = input.name;
  if (input.description != null) updates.description = input.description;
  if (input.agentId != null) updates.agentId = input.agentId;

  if (input.recurrence != null) {
    updates.recurrence = input.recurrence;
    updates.cronExpression = recurrenceToCron(input.recurrence);
  }

  const { Attributes } = await ctx.resources.ddb.entities.AgentJob.build(
    UpdateItemCommand,
  )
    .item(updates as { id: string })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Job ${id} not found`);
  return Attributes;
}
