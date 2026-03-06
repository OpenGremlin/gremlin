import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildMcpConfig } from "../skills/buildMcpConfig.js";
import {
  createDocumentTool,
  defaultTools,
  recallMemoryTool,
  saveMemoryTool,
  updateDocumentTool,
  updateTaskMessageTool,
} from "../tools/index.js";
import {
  browserClickTool,
  browserEvaluateTool,
  browserGetContentTool,
  browserNavigateTool,
  browserScreenshotTool,
  browserTypeTool,
} from "./browserTools.js";
import { runLane } from "./runLane.js";
import {
  checkCommandTool,
  launchSandboxTool,
  runCommandTool,
  terminateSandboxTool,
} from "./sandboxTools.js";
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

  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, task.agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${task.agentId} not found`);
  if (agent.retired) throw new Error(`Agent ${task.agentId} is retired`);

  // Log the prompt — SYSTEM for delegated tasks, USER for follow-up messages
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: opts?.role ?? "SYSTEM",
    content: prompt,
  });

  // Build MCP config from installed skills
  const mcpConfig = await buildMcpConfig(ctx).catch((err) => {
    ctx.log.error({ err, component: "skills" }, "Failed to build MCP config");
    return { mcpServers: {}, warnings: [], skillInstructions: [] };
  });

  let systemPrompt = renderPrompt("taskSystem", {
    name: agent.name,
    soul: agent.soul,
    userDisplayName: profile?.displayName ?? "the user",
    userAbout: profile?.about,
    taskTitle: task.title,
    taskId,
  });

  if (mcpConfig.skillInstructions.length > 0) {
    systemPrompt +=
      "\n\n# Active Skill Instructions\n\n" +
      mcpConfig.skillInstructions.join("\n\n");
  }

  return runLane(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt,
    tools: {
      ...defaultTools,
      updateTaskMessage: updateTaskMessageTool(ctx, taskId),
      createDocument: createDocumentTool(ctx, taskId),
      updateDocument: updateDocumentTool(ctx),
      saveMemory: saveMemoryTool(ctx, task.agentId),
      recallMemory: recallMemoryTool(ctx, task.agentId),
      launchSandbox: launchSandboxTool(ctx, task.agentId),
      runCommand: runCommandTool(ctx, task.agentId, taskId),
      checkCommand: checkCommandTool(ctx, task.agentId),
      terminateSandbox: terminateSandboxTool(ctx, task.agentId),
      browserNavigate: browserNavigateTool(ctx, task.agentId),
      browserScreenshot: browserScreenshotTool(ctx, task.agentId),
      browserClick: browserClickTool(ctx, task.agentId),
      browserType: browserTypeTool(ctx, task.agentId),
      browserEvaluate: browserEvaluateTool(ctx, task.agentId),
      browserGetContent: browserGetContentTool(ctx, task.agentId),
    },
    recallHint: prompt,
    timezone: profile?.timezone ?? undefined,
  });
}
