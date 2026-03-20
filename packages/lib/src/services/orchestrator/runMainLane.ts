import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
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

  return runLane(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderPrompt("system", {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: displayName,
      userAbout: profile?.about,
    }),
    tools: {
      delegateTask: delegateTaskTool(ctx, agentId),
      readDocument: readDocumentTool(),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
      listJobs: listJobsTool(ctx, agentId),
      scheduleJob: scheduleJobTool(ctx, agentId),
      updateJob: updateJobTool(ctx, agentId),
      ...(agent.config?.viewImage?.enabled
        ? { viewImage: viewImageTool(ctx) }
        : {}),
    },
    recallHint,
    timezone,
  });
}
