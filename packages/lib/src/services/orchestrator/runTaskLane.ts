import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildSkillConfig } from "../skills/buildMcpConfig.js";
import { buildSkillTools } from "../skills/buildSkillTools.js";
import {
  createBraveSearchTool,
  createDocumentTool,
  createTavilySearchTool,
  listJobsTool,
  postToMainLaneTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateDocumentTool,
  updateJobTool,
  updateTaskMessageTool,
  webFetch,
} from "../tools/index.js";
import { loadAgentContext } from "./loadAgentContext.js";
import { runLane } from "./runLane.js";
import { checkCommandTool, runCommandTool } from "./sandboxTools.js";
import { writeAgentLog } from "./writeAgentLog.js";

function buildConfigTools(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  config?: {
    sandbox?: { enabled: boolean } | null;
  } | null,
  skillEnvProvider?: () => Record<string, string>,
) {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  const tools: Record<string, any> = {};

  if (config?.sandbox?.enabled) {
    tools.runCommand = runCommandTool(ctx, agentId, taskId, skillEnvProvider);
    tools.checkCommand = checkCommandTool(ctx, agentId);
  }

  return tools;
}

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

  const { agent, profile, displayName, timezone } = await loadAgentContext(
    ctx,
    task.agentId,
  );

  // Log the prompt — SYSTEM for delegated tasks, USER for follow-up messages
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: opts?.role ?? "SYSTEM",
    content: prompt,
  });

  // Build skill instructions and skill tools in parallel
  const [skillConfig, skillToolsResult] = await Promise.all([
    buildSkillConfig(ctx, task.agentId).catch((err) => {
      ctx.log.error(
        { err, component: "skills" },
        "Failed to build skill config",
      );
      return { skillInstructions: [] };
    }),
    buildSkillTools(ctx, task.agentId, taskId).catch((err) => {
      ctx.log.error(
        { err, component: "skills" },
        "Failed to build skill tools",
      );
      return { tools: {}, getEnv: () => ({}) };
    }),
  ]);

  let systemPrompt = renderPrompt("taskSystem", {
    name: agent.name,
    soul: agent.soul,
    userDisplayName: displayName,
    userAbout: profile?.about,
    taskTitle: task.title,
    taskId,
  });

  if (skillConfig.skillInstructions.length > 0) {
    systemPrompt +=
      "\n\n# Active Skill Instructions\n\n" +
      skillConfig.skillInstructions.join("\n\n");
  }

  return runLane(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt,
    tools: {
      ...(agent.config?.webSearch?.enabled
        ? {
            webSearch:
              (agent.config.webSearch.provider ?? "brave") === "tavily"
                ? createTavilySearchTool(ctx)
                : createBraveSearchTool(ctx),
            webFetch,
          }
        : {}),
      updateTaskMessage: updateTaskMessageTool(ctx, taskId),
      postToMainLane: postToMainLaneTool(ctx, taskId),
      createDocument: createDocumentTool(ctx, taskId),
      updateDocument: updateDocumentTool(ctx),
      saveMemory: saveMemoryTool(ctx, task.agentId),
      recallMemory: recallMemoryTool(ctx, task.agentId),
      listJobs: listJobsTool(ctx, task.agentId),
      scheduleJob: scheduleJobTool(ctx, task.agentId),
      updateJob: updateJobTool(ctx, task.agentId),
      ...buildConfigTools(
        ctx,
        task.agentId,
        taskId,
        agent.config,
        skillToolsResult.getEnv,
      ),
      ...skillToolsResult.tools,
    },
    recallHint: prompt,
    timezone,
  });
}
