import { generateText } from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";
import { renderPrompt } from "../prompts/index.js";

/** Use an LLM to convert natural-language recurrence to a cron expression. */
export async function recurrenceToCron(
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
