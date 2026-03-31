import type { ServiceContext } from "../context.js";
import { renderSystemPrompt, resolvePromptFlags } from "../prompts/index.js";
import {
  delegateTaskTool,
  listJobsTool,
  readDocumentTool,
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
        soul: agent.soul,
        identity: agent.identity,
        userDisplayName: displayName,
        userAbout: profile?.about,
      },
      flags,
    ),
    tools: {
      delegateTask: delegateTaskTool(ctx, agentId),
      readDocument: readDocumentTool(),
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
  });
}
