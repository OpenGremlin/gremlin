import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import {
  browserClickTool,
  browserEvaluateTool,
  browserGetContentTool,
  browserNavigateTool,
  browserScreenshotTool,
  browserTypeTool,
} from "./browserTools.js";
import {
  launchSandboxTool,
  runCommandTool,
  terminateSandboxTool,
} from "./sandboxTools.js";
import {
  createDocumentTool,
  defaultTools,
  recallMemoryTool,
  saveMemoryTool,
  updateDocumentTool,
  updateTaskMessageTool,
} from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on a task's lane.
 * Called when starting a new task or resuming from a scheduled follow-up.
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
  const { messages, postCompactionCount } = await buildContextMessages(ctx, {
    agentId: task.agentId,
    taskId,
  });

  // Ensure the prompt is included (DDB eventual consistency may miss it)
  if (
    messages.length === 0 ||
    messages[messages.length - 1].content !== prompt
  ) {
    messages.push({ role: "user", content: prompt });
  }

  // Recall memories using task prompt
  const memories = await ctx.services.memory
    .recallMemories(ctx, task.agentId, prompt)
    .catch((err) => {
      ctx.log.error({ err, component: "memory" }, "Memory recall failed");
      return { recent: [], relevant: [] };
    });

  const memoryContext = buildMemoryContext(memories);

  const response = await runAgentTurn(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt: renderPrompt("taskSystem", {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: profile?.displayName ?? "the user",
      userAbout: profile?.about,
      taskTitle: task.title,
      taskId,
    }),
    timezone: profile?.timezone ?? undefined,
    memoryContext,
    messages,
    tools: {
      ...defaultTools,
      updateTaskMessage: updateTaskMessageTool(ctx, taskId),
      createDocument: createDocumentTool(ctx, taskId),
      updateDocument: updateDocumentTool(ctx),
      saveMemory: saveMemoryTool(ctx, task.agentId),
      recallMemory: recallMemoryTool(ctx, task.agentId),
      launchSandbox: launchSandboxTool(ctx, task.agentId),
      runCommand: runCommandTool(ctx, task.agentId),
      terminateSandbox: terminateSandboxTool(ctx, task.agentId),
      browserNavigate: browserNavigateTool(task.agentId),
      browserScreenshot: browserScreenshotTool(task.agentId),
      browserClick: browserClickTool(task.agentId),
      browserType: browserTypeTool(task.agentId),
      browserEvaluate: browserEvaluateTool(task.agentId),
      browserGetContent: browserGetContentTool(task.agentId),
    },
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, {
    agentId: task.agentId,
    taskId,
    messages,
    postCompactionCount,
  }).catch((err) =>
    ctx.log.error({ err, component: "compaction" }, "Compaction failed"),
  );

  return response;
}
