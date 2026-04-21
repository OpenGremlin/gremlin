import { hasToolCall, type ModelMessage, streamText, type Tool } from "ai";
import type { ServiceContext } from "../../context.js";
import { requestUserInputTool } from "../../tools/index.js";
import { asCacheCapableProvider, cacheMarker } from "../model/cacheMarkers.js";
import { getModelForAgent } from "../model/index.js";
import { writeAgentLog } from "../writeAgentLog.js";
import { buildReasoningProviderOptions } from "./buildReasoningProviderOptions.js";
import { buildTurnMessages } from "./buildTurnMessages.js";
import { createOnStepFinish, type TurnFlags } from "./onStepFinish.js";
import { createSpeechPipeline, type SpeechConfig } from "./streamSpeech.js";
import { withEagerLogging } from "./withEagerLogging.js";

export type { SpeechConfig } from "./streamSpeech.js";

export async function runAgentTurn(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    systemPrompt: string;
    memoryContext?: string;
    messages: ModelMessage[];
    tools?: Record<string, Tool>;
    reasoningEnabled?: boolean;
    /** When set, enables sentence-streaming TTS via signed URLs. */
    speech?: SpeechConfig;
  },
): Promise<string> {
  const lane = opts.taskId ? `task:${opts.taskId}` : "main";
  const baseTools = {
    ...opts.tools,
    requestUserInput: requestUserInputTool(ctx, opts.agentId, lane),
  };

  // Wrap tools to emit a call log immediately when execution starts
  const { tools: allTools, callLogIds } = withEagerLogging(
    baseTools,
    ctx,
    opts.agentId,
    opts.taskId,
  );

  const { model, warning: modelWarning } = await getModelForAgent(
    ctx,
    opts.agentId,
  );
  ctx.log.info({ model: String(model) }, "Starting agent turn with model");

  if (modelWarning) {
    await writeAgentLog(ctx, {
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "SYSTEM",
      content: JSON.stringify({
        type: "model_fallback",
        message: modelWarning,
      }),
    });
  }

  // Shared flag the onStepFinish handler flips when a command approval
  // is requested. streamText's `stopWhen` reads it below to halt inference.
  const flags: TurnFlags = { pendingApproval: false };

  const onStepFinish = createOnStepFinish(ctx, {
    agentId: opts.agentId,
    taskId: opts.taskId,
    callLogIds,
    flags,
  });

  const modelProviderId = typeof model === "string" ? model : model.provider;
  const cacheProvider = asCacheCapableProvider(modelProviderId);

  // Structure the prompt to maximize prompt-cache reuse:
  //   1. A stable system message (agent identity, tools usage, skills) with
  //      a 1h breakpoint — identical across turns for this agent; one write
  //      covers a whole hour of scheduled jobs, task dispatches, and
  //      conversational replies.
  //   2. A short dynamic preamble (recalled memories) as a regular user
  //      message, *outside* the cached region.
  //   3. The conversation history, with a 5m rolling breakpoint on the last
  //      assistant message. Rolling content changes fast, so a longer TTL
  //      would pay the 2× write premium for little reuse.
  // TTL ordering (1h must precede 5m) is satisfied by the layout above.
  // For providers without explicit cache breakpoints (OpenAI, Gemini, etc.),
  // `cacheProvider` is null — the prefix is still stable enough for whatever
  // implicit caching those providers offer.
  const { messages: builtMessages } = buildTurnMessages({
    systemPrompt: opts.systemPrompt,
    memoryContext: opts.memoryContext,
    history: opts.messages,
    systemCache: cacheProvider
      ? cacheMarker(cacheProvider, { ttl: "1h" })
      : undefined,
    rollingCache: cacheProvider
      ? cacheMarker(cacheProvider, { ttl: "5m" })
      : undefined,
  });

  // Pre-generate ID so the client can correlate stream deltas → final log entry
  const streamLogId = crypto.randomUUID();

  const publishDelta = (delta: string, done: boolean, kind?: string) => {
    ctx.resources.pubsub.publish(`agentStream:${opts.agentId}`, {
      logId: streamLogId,
      agentId: opts.agentId,
      taskId: opts.taskId,
      delta,
      done,
      kind,
    });
  };

  // Signal that inference has started (typing indicator)
  publishDelta("", false);

  const speechPipeline = createSpeechPipeline(ctx, {
    agentId: opts.agentId,
    taskId: opts.taskId,
    streamLogId,
    speech: opts.speech,
  });

  const providerOptions = opts.reasoningEnabled
    ? buildReasoningProviderOptions(modelProviderId)
    : undefined;

  const result = streamText({
    model,
    messages: builtMessages,
    tools: allTools,
    stopWhen: [hasToolCall("requestUserInput"), () => flags.pendingApproval],
    // biome-ignore lint/suspicious/noExplicitAny: provider options type is too strict for dynamic construction
    providerOptions: providerOptions as any,
    onStepFinish,
    onChunk: ({ chunk }) => {
      if (chunk.type === "reasoning-delta" && chunk.text) {
        publishDelta(chunk.text, false, "reasoning");
      } else if (chunk.type === "text-delta" && chunk.text) {
        publishDelta(chunk.text, false);
        speechPipeline.pushText(chunk.text);
      }
    },
  });

  // Wait for completion
  const finalText = await result.text;

  // Signal stream complete
  publishDelta("", true);

  // Flush remaining sentence and signal TTS done
  speechPipeline.finish();

  // Log the final text response
  if (finalText) {
    await writeAgentLog(ctx, {
      id: streamLogId,
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "AGENT",
      content: finalText,
    });
  }

  return finalText;
}
