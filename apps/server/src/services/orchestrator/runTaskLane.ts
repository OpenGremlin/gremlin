import type { ServiceContext } from "../context.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { renderTaskSystemPrompt } from "./prompts.js";
import { defaultTools } from "./tools.js";
import { updateTaskStatus } from "../tasks/updateTaskStatus.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on a task's lane.
 * Called when starting a new task or resuming from a TaskFollowUp.
 */
export async function runTaskLane(
  ctx: ServiceContext,
  taskId: string,
  prompt: string,
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const agent = await ctx.services.agents.getAgent(ctx, task.agentId);
  if (!agent) throw new Error(`Agent ${task.agentId} not found`);

  // Mark task as running
  await updateTaskStatus(ctx, taskId, "running");

  // Log the prompt as a system message in the task thread
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: "system",
    content: prompt,
  });

  // Build conversation history with compaction support
  const { messages, totalLogCount } = await buildContextMessages(ctx, {
    agentId: task.agentId,
    taskId,
  });

  // Ensure the prompt is included (DDB eventual consistency may miss it)
  if (messages.length === 0 || messages[messages.length - 1].content !== prompt) {
    messages.push({ role: "user", content: prompt });
  }

  const response = await runAgentTurn(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt: renderTaskSystemPrompt({
      name: agent.name,
      soul: agent.soul,
      taskTitle: task.title,
      taskId,
    }),
    messages,
    tools: defaultTools,
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, {
    agentId: task.agentId,
    taskId,
    messages,
    totalLogCount,
  }).catch((err) => console.error("compaction failed:", err));

  return response;
}
