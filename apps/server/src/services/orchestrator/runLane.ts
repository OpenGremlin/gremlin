import type { Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";

export interface LaneConfig {
  agentId: string;
  taskId: string | null;
  systemPrompt: string;
  tools: Record<string, Tool>;
  recallHint?: string;
  timezone?: string;
}

/**
 * Shared orchestration logic for both main and task lanes.
 * Builds context, recalls memories, runs one agent turn, and compacts.
 */
export async function runLane(
  ctx: ServiceContext,
  config: LaneConfig,
): Promise<string> {
  const { agentId, taskId, systemPrompt, tools, recallHint, timezone } = config;

  // Build conversation history with compaction support
  const { messages, postCompactionCount } = await buildContextMessages(ctx, {
    agentId,
    taskId,
  });

  // Recall memories
  const [memories, coreMemories] = await Promise.all([
    ctx.services.memory
      .recallMemories(ctx, agentId, recallHint ?? "")
      .catch((err) => {
        ctx.log.error({ err, component: "memory" }, "Memory recall failed");
        return { recent: [], relevant: [] };
      }),
    ctx.services.memory.getCoreMemories(ctx, agentId).catch((err) => {
      ctx.log.error({ err, component: "memory" }, "Core memory fetch failed");
      return [];
    }),
  ]);

  const memoryContext = buildMemoryContext({
    ...memories,
    core: coreMemories,
  });

  // Run agent turn
  const response = await runAgentTurn(ctx, {
    agentId,
    taskId,
    systemPrompt,
    timezone,
    memoryContext,
    messages,
    tools,
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, {
    agentId,
    taskId,
    messages,
    postCompactionCount,
  }).catch((err) =>
    ctx.log.error({ err, component: "compaction" }, "Compaction failed"),
  );

  return response;
}
