import { ToolName } from "../../../../enums.js";
import type { ServiceContext } from "../../../context.js";
import {
  attachFileTool,
  attachLinkTool,
  createBraveSearchTool,
  createTavilySearchTool,
  generateImageTool,
  generateSpeechTool,
  listJobsTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateJobTool,
  viewImageTool,
  webFetch,
} from "../../../tools/index.js";
import { buildTaskLaneTools } from "../../../tools/taskTracking/index.js";
import {
  ensureSandboxTool,
  readCommandOutputTool,
  runCommandTool,
} from "../../sandboxTools/index.js";
import type { AgentLaneContext } from "../types.js";
import { buildFileEditorTools } from "./buildFileEditorTools.js";

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
    ...buildTaskLaneTools(ctx),
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
          [ToolName.ReadCommandOutput]: readCommandOutputTool(
            ctx,
            agentId,
            taskId,
          ),
        }
      : {}),
    ...skillTools.tools,
  };

  return tools;
}
