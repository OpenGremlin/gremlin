import type { ServiceContext } from "../context.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { renderTaskSystemPrompt } from "../prompts/renderTaskSystemPrompt.js";
import {
  defaultTools,
  updateTaskStatusTool,
  createDocumentTool,
  updateDocumentTool,
} from "./tools.js";
import {
  launchSandboxTool,
  runCommandTool,
  terminateSandboxTool,
} from "./sandboxTools.js";
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
  opts?: { skipLog?: boolean },
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, task.agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${task.agentId} not found`);

  // Mark task as running
  await updateTaskStatus(ctx, taskId, "RUNNING");

  // Log the prompt as a system message (only for initial delegation;
  // user follow-ups are already logged as USER by sendMessage)
  if (!opts?.skipLog) {
    await writeAgentLog(ctx, {
      agentId: task.agentId,
      taskId,
      role: "SYSTEM",
      content: prompt,
    });
  }

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
      userDisplayName: profile?.displayName ?? "the user",
      userAbout: profile?.about,
      taskTitle: task.title,
      taskId,
    }),
    timezone: profile?.timezone ?? undefined,
    messages,
    tools: {
      ...defaultTools,
      updateTaskStatus: updateTaskStatusTool(ctx, taskId),
      createDocument: createDocumentTool(ctx, taskId),
      updateDocument: updateDocumentTool(ctx),
      launchSandbox: launchSandboxTool(ctx, task.agentId),
      runCommand: runCommandTool(ctx, task.agentId),
      terminateSandbox: terminateSandboxTool(ctx, task.agentId),
    },
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
