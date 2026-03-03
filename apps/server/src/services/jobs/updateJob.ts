import { generateText } from "ai";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { getModel } from "../orchestrator/model.js";

interface UpdateJobInput {
  name?: string | null;
  description?: string | null;
  recurrence?: string | null;
  agentId?: string | null;
  timezone?: string | null;
}

/** Use an LLM to convert natural-language recurrence to a cron expression. */
async function recurrenceToCron(
  ctx: ServiceContext,
  recurrence: string,
  timezone: string,
): Promise<string> {
  const { text } = await generateText({
    model: await getModel(ctx),
    system: renderPrompt("cron", { timezone }),
    messages: [{ role: "user", content: recurrence }],
  });

  const cron = text.trim();
  if (cron === "ERROR" || !cron) {
    throw new Error(
      `Could not parse recurrence: "${recurrence}". Try something like "every weekday at 9am" or "twice a day".`,
    );
  }

  // Basic sanity check: must be 5 space-separated fields
  if (cron.split(/\s+/).length !== 5) {
    throw new Error(
      `Could not parse recurrence: "${recurrence}". The model returned an invalid cron expression.`,
    );
  }

  return cron;
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
  if (input.timezone != null) updates.timezone = input.timezone;

  if (input.recurrence != null) {
    const timezone = input.timezone
      ?? (await ctx.services.jobs.getJob(ctx, id))?.timezone
      ?? "UTC";
    updates.recurrence = input.recurrence;
    updates.cronExpression = await recurrenceToCron(ctx, input.recurrence, timezone);
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
