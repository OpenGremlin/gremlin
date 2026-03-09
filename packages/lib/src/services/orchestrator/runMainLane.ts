import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import {
  createWebSearchTool,
  delegateTaskTool,
  recallMemoryTool,
  saveMemoryTool,
  webFetch,
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
      ...(agent.config?.webSearch?.enabled
        ? {
            webSearch: createWebSearchTool(
              ctx,
              agent.config.webSearch.provider ?? "brave",
            ),
            webFetch,
          }
        : {}),
      delegateTask: delegateTaskTool(ctx, agentId),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
    },
    recallHint,
    timezone,
  });
}
