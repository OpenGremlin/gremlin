import type { ServiceContext } from "../context.js";
import { renderSystemPrompt, resolvePromptFlags } from "../prompts/index.js";
import {
  backgroundTaskTool,
  FileStateTracker,
  listFilesTool,
  listJobsTool,
  readFileTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateJobTool,
  viewImageTool,
} from "../tools/index.js";
import type { AgentLaneContext } from "./agentLaneContext.js";
import { runLane } from "./runLane.js";

/**
 * Run an agent turn on the main lane (user conversation thread).
 * Receives a pre-built AgentLaneContext so agent/profile/skills
 * are never re-fetched within the same drain loop.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  recallHint?: string,
): Promise<string> {
  const { agent, profile, displayName, timezone } = agentLaneCtx;

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: agentLaneCtx.modelSupportsImages,
    hasSkills: !!agentLaneCtx.skillSummary.promptSection,
  });

  return runLane(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderSystemPrompt(
      {
        name: agent.name,
        personality: agent.personality,
        role: agent.role,
        userDisplayName: displayName,
        userAbout: profile?.about,
      },
      flags,
    ),
    tools: {
      backgroundTask: backgroundTaskTool(ctx, agentId),
      readFile: readFileTool(new FileStateTracker()),
      listFiles: listFilesTool(),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
      listJobs: listJobsTool(ctx, agentId),
      scheduleJob: scheduleJobTool(ctx, agentId),
      updateJob: updateJobTool(ctx, agentId),
      ...(flags.viewImage ? { viewImage: viewImageTool(ctx) } : {}),
    },
    recallHint,
    timezone,
    reasoningEnabled:
      (agent.config?.reasoning?.enabled ?? false) &&
      agentLaneCtx.modelSupportsReasoning,
    ...(agentLaneCtx.speechConnectionId
      ? {
          speech: {
            voice: agentLaneCtx.speechVoice,
            connectionId: agentLaneCtx.speechConnectionId,
          },
        }
      : {}),
  });
}
