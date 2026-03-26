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

  // Run agent turn — on LLM API errors, log the error and retry so the
  // model can see what went wrong and adapt (e.g. avoid an oversized image).
  const MAX_ERROR_RETRIES = 2;
  let response: string;
  let errorRetries = 0;

  while (true) {
    try {
      response = await runAgentTurn(ctx, {
        agentId,
        taskId,
        systemPrompt,
        timezone,
        memoryContext,
        messages:
          errorRetries > 0
            ? await buildContextMessages(ctx, { agentId, taskId }).then(
                (r) => r.messages,
              )
            : messages,
        tools,
      });
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ctx.log.error({ err, agentId, taskId }, "Agent turn failed");
      await writeAgentLog(ctx, {
        agentId,
        taskId,
        role: "SYSTEM",
        content: JSON.stringify({
          type: "error",
          message: `An error occurred while processing your last action: ${message}`,
        }),
      });

      errorRetries++;
      if (errorRetries >= MAX_ERROR_RETRIES) {
        ctx.log.error(
          { agentId, taskId, errorRetries },
          "Max error retries reached, giving up",
        );
        throw err;
      }

      ctx.log.info(
        { agentId, taskId, errorRetries },
        "Retrying agent turn after error",
      );
    }
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
