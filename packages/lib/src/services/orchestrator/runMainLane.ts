import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import {
  createBraveSearchTool,
  createDocumentTool,
  createTavilySearchTool,
  delegateTaskTool,
  recallMemoryTool,
  saveMemoryTool,
  updateDocumentTool,
  webFetch,
} from "../tools/index.js";
import { loadAgentContext } from "./loadAgentContext.js";
import { runLane } from "./runLane.js";

function webSearchTools(ctx: ServiceContext, provider: string) {
  const searchTool =
    provider === "tavily"
      ? createTavilySearchTool(ctx)
      : createBraveSearchTool(ctx);
  return { webSearch: searchTool, webFetch };
}

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
        ? webSearchTools(ctx, agent.config.webSearch.provider ?? "brave")
        : {}),
      createDocument: createDocumentTool(ctx, null),
      updateDocument: updateDocumentTool(ctx),
      delegateTask: delegateTaskTool(ctx, agentId),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
    },
    recallHint,
    timezone,
  });
}
