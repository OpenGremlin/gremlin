import { generateObject } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { getModelForAgent } from "./model.js";

const log = createLogger("planner");

const planSchema = z.object({
  steps: z
    .array(z.string())
    .describe(
      "Ordered steps to accomplish the objective. Each step must be self-contained with all information needed to execute it.",
    ),
});

export type Plan = z.infer<typeof planSchema>;

const PLANNER_SYSTEM_PROMPT = `You are a planning assistant. For the given task, produce a concise step-by-step plan.

Rules:
- Each step must be self-contained — include all context needed to execute it independently.
- Do not add superfluous steps. Be direct and efficient.
- The final step should deliver the result to the user.
- Keep steps actionable — each one should map to concrete tool usage or a clear deliverable.
- Typically 2–6 steps. Only use more if the task genuinely requires it.`;

/**
 * Generate a structured execution plan for a task.
 * Uses the agent's configured model to produce an ordered list of steps.
 */
export async function generatePlan(
  ctx: ServiceContext,
  agentId: string,
  taskTitle: string,
  prompt: string,
): Promise<Plan> {
  const { model } = await getModelForAgent(ctx, agentId);

  log.info({ agentId, taskTitle }, "Generating execution plan");

  const { object } = await generateObject({
    model,
    schema: planSchema,
    system: PLANNER_SYSTEM_PROMPT,
    prompt: `Task: ${taskTitle}\n\nDetails:\n${prompt}`,
  });

  log.info(
    { agentId, taskTitle, stepCount: object.steps.length },
    "Plan generated",
  );

  return object;
}

/**
 * Format a plan as a readable string for injection into prompts or logs.
 */
export function formatPlan(plan: Plan): string {
  return plan.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
}
