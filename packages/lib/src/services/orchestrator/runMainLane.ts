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
} from "../tools/index.js";
import { loadAgentContext } from "./loadAgentContext.js";
import { runLane } from "./runLane.js";

/**
 * Run an agent turn on the main lane (user conversation thread).
 * All user messages are already in the log — this just runs inference.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentId: string,
  recallHint?: string,
): Promise<string> {
  const { agent, profile, displayName, timezone } = await loadAgentContext(
    ctx,
    agentId,
  );

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
    },
    recallHint,
    timezone,
  });
}
