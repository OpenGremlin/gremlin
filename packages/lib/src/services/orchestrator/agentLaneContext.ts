import type { ServiceContext } from "../context.js";
import type { EnabledModel } from "../integrations/getEnabledModels.js";
import { buildSkillSummary } from "../skills/buildSkillSummary.js";
import type { SkillToolsResult } from "../skills/buildSkillTools.js";
import { buildSkillTools } from "../skills/buildSkillTools.js";
import {
  attachFileTool,
  attachLinkTool,
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
  viewImageTool,
  webFetch,
} from "../tools/index.js";
import { loadAgentContext } from "./loadAgentContext.js";
import { ensureSandboxTool, runCommandTool } from "./sandboxTools.js";

/**
 * Per-agent context built once and shared across all lane invocations
 * (main lane + task lanes) within the same drain loop.
 */
export interface AgentLaneContext {
  agent: Awaited<ReturnType<typeof loadAgentContext>>["agent"];
  profile: Awaited<ReturnType<typeof loadAgentContext>>["profile"];
  displayName: string;
  timezone: string | undefined;
  skillSummary: { promptSection: string };
  skillTools: SkillToolsResult;
  modelSupportsImages: boolean;
  modelSupportsReasoning: boolean;
}

/**
 * Resolve the selected model's metadata to check capability flags.
 */
async function resolveModelCapabilities(
  ctx: ServiceContext,
  agentModel:
    | { type: string; modelId?: string; connectionId?: string }
    | undefined
    | null,
): Promise<{ supportsImages: boolean; supportsReasoning: boolean }> {
  const defaults = { supportsImages: true, supportsReasoning: false };
  if (!agentModel) return defaults;
  let providerId: string;
  let modelId: string;
  if (agentModel.type === "bedrock" && agentModel.modelId) {
    providerId = "bedrock";
    modelId = agentModel.modelId;
  } else if (agentModel.type === "connection" && agentModel.connectionId) {
    [providerId, modelId] = agentModel.connectionId.split(":", 2);
  } else {
    return defaults;
  }
  let models: EnabledModel[];
  try {
    models = await ctx.services.integrations.getEnabledModels(
      ctx.resources,
      providerId,
    );
  } catch {
    return defaults;
  }
  const match = models.find((m) => m.id === modelId);
  return {
    supportsImages: match?.supportedModalities
      ? match.supportedModalities.includes("image")
      : true,
    supportsReasoning: match?.supportsReasoning ?? false,
  };
}

/**
 * Build the per-agent context. Call once per drain loop (or once in a CLI
 * script) and pass into every lane function.
 */
export async function buildAgentLaneContext(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentLaneContext> {
  const { agent, profile, displayName, timezone } = await loadAgentContext(
    ctx,
    agentId,
  );

  const [skillSummary, skillTools, modelCapabilities] = await Promise.all([
    buildSkillSummary(ctx, agentId).catch((err) => {
      ctx.log.error(
        { err, component: "skills" },
        "Failed to build skill summary",
      );
      return { promptSection: "" };
    }),
    buildSkillTools(ctx, agentId).catch((err) => {
      ctx.log.error(
        { err, component: "skills" },
        "Failed to build skill tools",
      );
      return { tools: {}, getEnv: () => ({}) } as SkillToolsResult;
    }),
    resolveModelCapabilities(ctx, agent.config?.model),
  ]);

  return {
    agent,
    profile,
    displayName,
    timezone,
    skillSummary,
    skillTools,
    modelSupportsImages: modelCapabilities.supportsImages,
    modelSupportsReasoning: modelCapabilities.supportsReasoning,
  };
}

/**
 * Assemble the task-lane tool set for a specific task.
 * Uses the pre-built AgentLaneContext for agent config and skill tools,
 * and binds per-task tools (sandbox, documents, etc.) to the given taskId.
 */
export function buildTaskTools(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  taskId: string,
) {
  const { agent, skillTools } = agentLaneCtx;

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
    attachFile: attachFileTool(ctx, taskId),
    attachLink: attachLinkTool(ctx, taskId),
    saveMemory: saveMemoryTool(ctx, agentId),
    recallMemory: recallMemoryTool(ctx, agentId),
    listJobs: listJobsTool(ctx, agentId),
    scheduleJob: scheduleJobTool(ctx, agentId),
    updateJob: updateJobTool(ctx, agentId),
    ...(agent.config?.viewImage?.enabled && agentLaneCtx.modelSupportsImages
      ? { viewImage: viewImageTool(ctx) }
      : {}),
    ...(agent.config?.sandbox?.enabled
      ? {
          ensureSandbox: ensureSandboxTool(ctx, agentId, taskId),
          runCommand: runCommandTool(
            ctx,
            agentId,
            taskId,
            skillTools.getEnv,
            agent.config?.sandbox?.commandApproval !== "skip",
          ),
        }
      : {}),
    ...skillTools.tools,
  };

  return tools;
}
