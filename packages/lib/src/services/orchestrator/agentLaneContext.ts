import { ToolName } from "../../enums.js";
import type { ServiceContext } from "../context.js";
import type { EnabledModel } from "../integrations/getEnabledModels.js";
import { buildSkillSummary } from "../skills/buildSkillSummary.js";
import type { SkillToolsResult } from "../skills/buildSkillTools.js";
import { buildSkillTools } from "../skills/buildSkillTools.js";
import {
  attachFileTool,
  attachLinkTool,
  createBraveSearchTool,
  createTavilySearchTool,
  editFileTool,
  FileStateTracker,
  generateImageTool,
  generateSpeechTool,
  globTool,
  grepTool,
  listFilesTool,
  listJobsTool,
  postToMainLaneTool,
  readFileTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateJobTool,
  updateTaskMessageTool,
  viewImageTool,
  webFetch,
  writeFileTool,
} from "../tools/index.js";
import { loadAgentContext } from "./loadAgentContext.js";
import {
  getImageModelFromConfig,
  getSpeechConnectionId,
  getSpeechModelFromConfig,
} from "./model.js";
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
  imageModel: import("ai").ImageModel | null;
  speechModel: import("ai").SpeechModel | null;
  speechVoice: string | undefined;
  /** Connection ID string for the speech model (e.g. "openai:tts-1"). */
  speechConnectionId: string | undefined;
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

  const [
    skillSummary,
    skillTools,
    modelCapabilities,
    imageModel,
    speechModel,
    speechConnectionId,
  ] = await Promise.all([
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
    agent.config?.imageGeneration?.enabled
      ? getImageModelFromConfig(ctx, agent.config?.imageModel).catch((err) => {
          ctx.log.warn(
            { err, component: "imageModel" },
            "Failed to resolve image model",
          );
          return null;
        })
      : Promise.resolve(null),
    agent.config?.speech?.enabled
      ? getSpeechModelFromConfig(ctx, agent.config?.speechModel).catch(
          (err) => {
            ctx.log.warn(
              { err, component: "speechModel" },
              "Failed to resolve speech model",
            );
            return null;
          },
        )
      : Promise.resolve(null),
    agent.config?.speech?.enabled
      ? getSpeechConnectionId(ctx, agent.config?.speechModel).catch(() => null)
      : Promise.resolve(null),
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
    imageModel,
    speechModel,
    speechVoice: agent.config?.speech?.voice ?? agent.ttsVoice,
    speechConnectionId: speechConnectionId ?? undefined,
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
  const tools: Partial<Record<ToolName, any>> & Record<string, any> = {
    ...(agent.config?.webSearch?.enabled
      ? {
          [ToolName.WebSearch]:
            (agent.config.webSearch.provider ?? "brave") === "tavily"
              ? createTavilySearchTool(ctx)
              : createBraveSearchTool(ctx),
          [ToolName.WebFetch]: webFetch,
        }
      : {}),
    [ToolName.UpdateTaskMessage]: updateTaskMessageTool(ctx, taskId),
    [ToolName.PostToMainLane]: postToMainLaneTool(ctx, taskId),
    ...buildFileEditorTools(ctx, taskId),
    [ToolName.AttachFile]: attachFileTool(ctx, taskId),
    [ToolName.AttachLink]: attachLinkTool(ctx, taskId),
    [ToolName.SaveMemory]: saveMemoryTool(ctx, agentId),
    [ToolName.RecallMemory]: recallMemoryTool(ctx, agentId),
    [ToolName.ListJobs]: listJobsTool(ctx, agentId),
    [ToolName.ScheduleJob]: scheduleJobTool(ctx, agentId),
    [ToolName.UpdateJob]: updateJobTool(ctx, agentId),
    ...(agent.config?.viewImage?.enabled && agentLaneCtx.modelSupportsImages
      ? { [ToolName.ViewImage]: viewImageTool(ctx) }
      : {}),
    ...(agentLaneCtx.imageModel
      ? {
          [ToolName.GenerateImage]: generateImageTool(
            ctx,
            agentLaneCtx.imageModel,
            taskId,
          ),
        }
      : {}),
    ...(agentLaneCtx.speechModel
      ? {
          [ToolName.GenerateSpeech]: generateSpeechTool(
            ctx,
            agentLaneCtx.speechModel,
            agentLaneCtx.speechVoice,
            taskId,
          ),
        }
      : {}),
    ...(agent.config?.sandbox?.enabled
      ? {
          [ToolName.EnsureSandbox]: ensureSandboxTool(ctx, agentId, taskId),
          [ToolName.RunCommand]: runCommandTool(
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

/**
 * Build the file editor tool set (read, write, edit, list, glob, grep) with a
 * shared FileStateTracker so that staleness detection works across tools.
 */
function buildFileEditorTools(ctx: ServiceContext, taskId: string) {
  const tracker = new FileStateTracker();
  return {
    [ToolName.ReadFile]: readFileTool(tracker),
    [ToolName.WriteFile]: writeFileTool(ctx, tracker, taskId),
    [ToolName.EditFile]: editFileTool(ctx, tracker, taskId),
    [ToolName.ListFiles]: listFilesTool(),
    [ToolName.Glob]: globTool(),
    [ToolName.Grep]: grepTool(),
  };
}
