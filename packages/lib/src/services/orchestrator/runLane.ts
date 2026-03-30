import type { Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import {
  buildContextMessages,
  estimateContextTokens,
  maybeCompact,
} from "./compaction.js";
import { getModelForAgent } from "./model.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { writeAgentLog } from "./writeAgentLog.js";

export interface LaneConfig {
  agentId: string;
  taskId: string | null;
  systemPrompt: string;
  tools: Record<string, Tool>;
  recallHint?: string;
  timezone?: string;
  /** Enable extended thinking / reasoning for this lane. */
  reasoningEnabled?: boolean;
  /** Initial user-role prompt to prepend if not yet in the log (avoids read-after-write race). */
  initialPrompt?: string;
}

/**
 * Shared orchestration logic for both main and task lanes.
 * Builds context, recalls memories, runs one agent turn, and compacts.
 */
export async function runLane(
  ctx: ServiceContext,
  config: LaneConfig,
): Promise<string> {
  const {
    agentId,
    taskId,
    systemPrompt,
    tools,
    recallHint,
    timezone,
    reasoningEnabled,
    initialPrompt,
  } = config;

  // Build conversation history with compaction support
  const { messages } = await buildContextMessages(ctx, {
    agentId,
    taskId,
  });

  // Resolve model metadata for token-based compaction
  const { maxInputTokens } = await getModelForAgent(ctx, agentId);

  // If an initial prompt was provided and the log came back empty (DynamoDB
  // eventual consistency), inject it so the conversation always starts with
  // a user message.
  if (initialPrompt && messages.length === 0) {
    messages.push({ role: "user", content: initialPrompt });
  }

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

  // Estimate token usage before the agent turn for compaction decision
  const fullSystemPrompt = [systemPrompt, memoryContext]
    .filter(Boolean)
    .join("\n\n");
  const contextTokens = estimateContextTokens(messages, fullSystemPrompt);

  // Run agent turn. On failure, append the error to the conversation and
  // run one recovery turn so the model can see what went wrong and respond
  // to the user (e.g. "that image format isn't supported"). If the recovery
  // turn also fails (e.g. a poison-pill message in the conversation that
  // breaks the SDK), return gracefully so the consumer drain loop stays alive.
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
      reasoningEnabled,
    });
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

    // Recovery turn: rebuild context (now includes the error) and let
    // the model respond. If this also fails, return gracefully.
    try {
      const recoveryMessages = await buildContextMessages(ctx, {
        agentId,
        taskId,
      }).then((r) => r.messages);

      response = await runAgentTurn(ctx, {
        agentId,
        taskId,
        systemPrompt,
        timezone,
        memoryContext,
        messages: recoveryMessages,
        tools,
        reasoningEnabled,
      });
    } catch (recoveryErr) {
      ctx.log.error(
        { err: recoveryErr, agentId, taskId },
        "Recovery turn also failed, returning gracefully",
      );
      // Write a fallback AGENT log so the conversation history has a proper
      // assistant turn after the SYSTEM error. Without this, consecutive
      // user-role messages (SYSTEM maps to user) can break models that
      // require strict user/assistant alternation.
      const fallback =
        "I'm sorry, I encountered an error I couldn't recover from. Please try again or rephrase your request.";
      await writeAgentLog(ctx, {
        agentId,
        taskId,
        role: "AGENT",
        content: fallback,
      });
      response = fallback;
    }
  }

  // Fire-and-forget compaction (triggered when context exceeds 70% of model limit)
  maybeCompact(ctx, {
    agentId,
    taskId,
    messages,
    contextTokens,
    maxInputTokens,
  }).catch((err) =>
    ctx.log.error({ err, component: "compaction" }, "Compaction failed"),
  );

  return response;
}
