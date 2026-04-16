import { hasToolCall, type ModelMessage, streamText, type Tool } from "ai";
import type { ServiceContext } from "../../context.js";
import { requestUserInputTool } from "../../tools/index.js";
import { getModelForAgent } from "../model/index.js";
import { writeAgentLog } from "../writeAgentLog.js";
import { buildReasoningProviderOptions } from "./buildReasoningProviderOptions.js";
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
    timezone?: string;
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

  const tz = opts.timezone ?? "UTC";
  const currentTime = new Date().toLocaleDateString("en-US", { timeZone: tz });

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

  const systemParts = [
    opts.systemPrompt,
    `Current time: ${currentTime} (${tz})`,
    ...(opts.memoryContext ? [opts.memoryContext] : []),
  ];

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

  const modelProvider = typeof model === "string" ? model : model.provider;
  const providerOptions = opts.reasoningEnabled
    ? buildReasoningProviderOptions(modelProvider)
    : undefined;

  const result = streamText({
    model,
    system: systemParts.join("\n\n"),
    messages: opts.messages,
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
