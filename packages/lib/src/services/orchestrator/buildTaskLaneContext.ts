import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildSkillSummary } from "../skills/buildMcpConfig.js";
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
import {
  checkCommandTool,
  ensureSandboxTool,
  runCommandTool,
} from "./sandboxTools.js";

export interface TaskLaneContext {
  agent: Awaited<ReturnType<typeof loadAgentContext>>["agent"];
  profile: Awaited<ReturnType<typeof loadAgentContext>>["profile"];
  agentId: string;
  displayName: string;
  timezone: string | undefined;
  systemPrompt: string;
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  tools: Record<string, any>;
}

/**
 * Build the full task-lane context: agent, system prompt, and tools.
 * Shared by runTaskLane (production) and invoke (debug CLI).
 */
export async function buildTaskLaneContext(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  taskTitle: string,
): Promise<TaskLaneContext> {
  const { agent, profile, displayName, timezone } = await loadAgentContext(
    ctx,
    agentId,
  );

  const [skillSummary, skillToolsResult] = await Promise.all([
    buildSkillSummary(ctx, agentId).catch((err) => {
      ctx.log.error(
        { err, component: "skills" },
        "Failed to build skill summary",
      );
      return { promptSection: "" };
    }),
    buildSkillTools(ctx, agentId, taskId).catch((err) => {
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
    taskTitle,
    taskId,
  });

  if (skillSummary.promptSection) {
    systemPrompt += `\n\n${skillSummary.promptSection}`;
  }

  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  const tools: Record<string, any> = {
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
    saveMemory: saveMemoryTool(ctx, agentId),
    recallMemory: recallMemoryTool(ctx, agentId),
    listJobs: listJobsTool(ctx, agentId),
    scheduleJob: scheduleJobTool(ctx, agentId),
    updateJob: updateJobTool(ctx, agentId),
    ...(agent.config?.sandbox?.enabled
      ? {
          ensureSandbox: ensureSandboxTool(ctx, agentId, taskId),
          runCommand: runCommandTool(
            ctx,
            agentId,
            taskId,
            skillToolsResult.getEnv,
          ),
          checkCommand: checkCommandTool(ctx, agentId),
        }
      : {}),
    ...skillToolsResult.tools,
  };

  return {
    agent,
    profile,
    agentId,
    displayName,
    timezone,
    systemPrompt,
    tools,
  };
}
