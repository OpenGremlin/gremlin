import type { Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { publishAgentTurnMetric } from "../metrics/publishAgentTurn.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import {
  buildContextMessages,
  effectiveInputLimit,
  estimateContextTokens,
  maybeCompact,
  PRE_PROMPT_COMPACTION_RATIO,
} from "./compaction/index.js";
import { getModelForAgent } from "./model/index.js";
import { runAgentTurn, type SpeechConfig } from "./runAgentTurn/index.js";
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
  /** When set, enables sentence-streaming TTS via signed URLs. */
  speech?: SpeechConfig;
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
  let contextTokens = estimateContextTokens(messages, fullSystemPrompt, tools);

  // Pre-prompt overflow guard: if context is approaching the model's input
  // limit, compact synchronously before sending to avoid a context overflow
  // during the agent turn.
  const inputLimit = effectiveInputLimit(maxInputTokens);
  if (contextTokens >= inputLimit * PRE_PROMPT_COMPACTION_RATIO) {
    ctx.log.warn(
      { contextTokens, inputLimit, agentId, taskId },
      "Context approaching limit, compacting before prompt",
    );
    try {
      await maybeCompact(ctx, {
        agentId,
        taskId,
        messages,
        contextTokens,
        maxInputTokens,
      });
      const rebuilt = await buildContextMessages(ctx, { agentId, taskId });
      messages.length = 0;
      messages.push(...rebuilt.messages);
      contextTokens = estimateContextTokens(messages, fullSystemPrompt);
      // TODO: if contextTokens is still >= inputLimit * PRE_PROMPT_COMPACTION_RATIO
      // here, the recent messages alone exceed the budget. We should truncate
      // the oldest non-compaction messages as a last resort.
      if (contextTokens >= inputLimit * PRE_PROMPT_COMPACTION_RATIO) {
        ctx.log.warn(
          { contextTokens, inputLimit, agentId, taskId },
          "Context still over threshold after compaction; agent turn may overflow",
        );
      }
    } catch (err) {
      ctx.log.error(
        { err, component: "compaction", agentId, taskId },
        "Pre-prompt compaction failed, proceeding with oversized context (agent turn likely to fail)",
      );
    }
  }

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
      memoryContext,
      messages,
      tools,
      reasoningEnabled,
      speech: config.speech,
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
        memoryContext,
        messages: recoveryMessages,
        tools,
        reasoningEnabled,
        speech: config.speech,
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

  // Fire-and-forget billing metric (only publishes in managed SaaS deployments)
  publishAgentTurnMetric(agentId).catch(() => {});

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
