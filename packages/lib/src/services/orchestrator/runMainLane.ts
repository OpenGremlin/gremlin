import type { ServiceContext } from "../context.js";
import { renderSystemPrompt, resolvePromptFlags } from "../prompts/index.js";
import {
  backgroundTaskTool,
  delegateTool,
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

  const isManager = !!agent.config?.manager?.enabled;

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: agentLaneCtx.modelSupportsImages,
    hasSkills: !!agentLaneCtx.skillSummary.promptSection,
  });

  let systemPrompt = renderSystemPrompt(
    {
      name: agent.name,
      personality: agent.personality,
      role: agent.role,
      userDisplayName: displayName,
      userAbout: profile?.about,
      ...(isManager
        ? {
            manager: {
              team: agentLaneCtx.team,
              activeDelegations: agentLaneCtx.activeDelegations,
            },
          }
        : {}),
    },
    flags,
  );

  // Tell the main lane about its own skills using the instruction-free
  // variant — the model only has backgroundTask/delegate here, NOT
  // readSkill/runCommand/authenticate, so the verbose task-lane format
  // would tempt it to hallucinate tool calls into thin air.
  if (agentLaneCtx.skillSummary.mainLaneSection) {
    systemPrompt += `\n\n${agentLaneCtx.skillSummary.mainLaneSection}`;
  }

  return runLane(ctx, {
    agentId,
    taskId: null,
    systemPrompt,
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
      // delegate is structurally restricted to the main lane only —
      // task lanes never get this tool, which is how we enforce
      // "no nested delegation" without runtime checks.
      ...(isManager
        ? { delegate: delegateTool(ctx, agentId, agentLaneCtx.team) }
        : {}),
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
