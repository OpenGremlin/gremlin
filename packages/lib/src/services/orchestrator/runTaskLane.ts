import type { ServiceContext } from "../context.js";
import { buildTaskLaneContext } from "./buildTaskLaneContext.js";
import { runLane } from "./runLane.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on a task's lane.
 * Writes the prompt to the log, then runs inference via shared runLane.
 */
export async function runTaskLane(
  ctx: ServiceContext,
  taskId: string,
  prompt: string,
  opts?: { role?: "SYSTEM" | "USER" },
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const { agentId, systemPrompt, tools, timezone } = await buildTaskLaneContext(
    ctx,
    task.agentId,
    taskId,
    task.title,
  );

  // Log the prompt — SYSTEM for delegated tasks, USER for follow-up messages
  await writeAgentLog(ctx, {
    agentId,
    taskId,
    role: opts?.role ?? "SYSTEM",
    content: prompt,
  });

  ctx.log.info(
    { agentId, taskId, systemPromptLength: systemPrompt.length },
    "Task lane system prompt: %s",
    systemPrompt,
  );

  return runLane(ctx, {
    agentId,
    taskId,
    systemPrompt,
    tools,
    recallHint: prompt,
    timezone,
  });
}
