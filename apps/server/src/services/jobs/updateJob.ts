import { generateText } from "ai";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";

interface UpdateJobInput {
  name?: string | null;
  description?: string | null;
  recurrence?: string | null;
  agentId?: string | null;
}

const CRON_SYSTEM_PROMPT = `You convert natural-language schedule descriptions into standard 5-field cron expressions (minute hour day-of-month month day-of-week).

Rules:
- Output ONLY the cron expression, nothing else. No explanation, no markdown.
- Use 24-hour time. Default to 09:00 UTC when no time is specified.
- Day-of-week: 0=Sunday, 1=Monday, ..., 6=Saturday.
- If the input is ambiguous, pick the most reasonable interpretation.
- If the input cannot be interpreted as a schedule at all, respond with exactly: ERROR`;

/** Use an LLM to convert natural-language recurrence to a cron expression. */
async function recurrenceToCron(recurrence: string): Promise<string> {
  const { text } = await generateText({
    model: getModel(),
    system: CRON_SYSTEM_PROMPT,
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

  if (input.recurrence != null) {
    updates.recurrence = input.recurrence;
    updates.cronExpression = await recurrenceToCron(input.recurrence);
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
