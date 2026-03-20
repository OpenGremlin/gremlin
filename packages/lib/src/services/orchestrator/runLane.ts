import type { Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { writeAgentLog } from "./writeAgentLog.js";

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
  let response: string;
  try {
    response = await runAgentTurn(ctx, {
      agentId,
      taskId,
      systemPrompt,
      timezone,
      memoryContext,
      messages,
      tools,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.log.error({ err, agentId, taskId }, "Agent turn failed");
    await writeAgentLog(ctx, {
      agentId,
      taskId,
      role: "SYSTEM",
      content: JSON.stringify({ type: "error", message }),
    });
    throw err;
  }

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
