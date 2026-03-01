import type { ModelMessage } from "ai";
import type { ServiceContext } from "../context.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { defaultTools } from "./tools.js";
import { updateTaskStatus } from "./updateTaskStatus.js";
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

  // Build conversation history from task thread logs
  const logs = await ctx.services.agentLogs.getTaskLogs(ctx, taskId);
  const messages: ModelMessage[] = logs.map((log) => ({
    role: log.role === "agent" ? "assistant" : "user",
    content: log.content,
  }));

  // Add the resume/continuation prompt
  messages.push({ role: "user", content: prompt });

  // Log the prompt as a system message in the task thread
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: "system",
    content: prompt,
  });

  const response = await runAgentTurn(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt: [
      agent.soul,
      "",
      `You are working on task: "${task.title}" (ID: ${taskId}).`,
      "You have access to tools. When you need to wait for an external response (e.g., email reply),",
      "say so clearly and end your turn. The orchestrator will handle scheduling a follow-up.",
    ].join("\n"),
    messages,
    tools: defaultTools,
  });

  return response;
}
