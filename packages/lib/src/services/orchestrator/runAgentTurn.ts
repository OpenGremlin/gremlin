import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { hasToolCall, type ModelMessage, streamText, type Tool } from "ai";
import type { ToolName } from "../../enums.js";
import type { SpeechAudioEvent } from "../../resources/pubsub.js";
import type { ServiceContext } from "../context.js";
import { SentenceAccumulator } from "../speech/SentenceAccumulator.js";
import { buildSpeechUrl } from "../speech/signedSpeechUrl.js";
import { stripMarkdownForSpeech } from "../speech/stripMarkdownForSpeech.js";
import { requestUserInputTool } from "../tools/index.js";
import { getModelForAgent } from "./model.js";
import { updateAgentLogResult, writeAgentLog } from "./writeAgentLog.js";

/**
 * Wrap tools to emit a TOOL log entry (input only) when execution starts.
 * Returns the wrapped tools and a map of toolCallId → logEntryId for
 * updating the entry with the result later.
 */
function withEagerLogging(
  tools: Record<string, Tool>,
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): {
  tools: Record<string, Tool>;
  callLogIds: Map<string, { logId: string; createdAt: string }>;
} {
  const callLogIds = new Map<string, { logId: string; createdAt: string }>();
  const wrapped: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    wrapped[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        // Write call log immediately (no result yet)
        const { id: logId, createdAt } = await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: name as ToolName,
          toolInput: input,
          toolResult: null,
          internal: false,
        });
        // Track by toolCallId from the AI SDK options
        const toolCallId = (options as { toolCallId?: string })?.toolCallId;
        if (toolCallId) callLogIds.set(toolCallId, { logId, createdAt });
        // @ts-expect-error — Tool execute signature varies
        return t.execute(input, options);
      },
    };
  }
  return { tools: wrapped, callLogIds };
}

function buildReasoningProviderOptions(
  modelProvider: string,
): Record<string, Record<string, unknown>> | undefined {
  // Anthropic: opt-in via thinking config
  if (modelProvider.startsWith("anthropic")) {
    return { anthropic: { thinking: { type: "adaptive" } } };
  }
  // OpenAI reasoning models (o1/o3) reason by default — no extra options needed
  // DeepSeek reasoning is automatic
  // For other providers, no standard reasoning option
  return undefined;
}

export interface SpeechConfig {
  voice: string | undefined;
  connectionId: string;
}

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
  // Track whether a command approval was created — if so, halt after this step
  let pendingCommandApproval = false;

  const onStepFinish = async (step: {
    toolCalls: Array<{
      toolName: string;
      toolCallId?: string;
      input?: unknown;
    }>;
    toolResults: Array<{ output?: unknown } | undefined>;
  }) => {
    for (let i = 0; i < step.toolCalls.length; i++) {
      const toolCall = step.toolCalls[i];
      const toolResult = step.toolResults[i];
      const toolCallId =
        "toolCallId" in toolCall ? (toolCall.toolCallId as string) : undefined;
      const existing = toolCallId ? callLogIds.get(toolCallId) : undefined;

      // Extract commandApprovalId from runCommand results
      const resultOutput = toolResult?.output as
        | Record<string, unknown>
        | undefined;
      const commandApprovalId =
        toolCall.toolName === "runCommand" && resultOutput?.commandApprovalId
          ? (resultOutput.commandApprovalId as string)
          : undefined;

      if (commandApprovalId) {
        pendingCommandApproval = true;
      }

      if (existing) {
        // If this is a command approval, back-fill the logEntryId on the
        // CommandApproval entity so resolveCommandApproval can update this
        // log entry later.
        if (commandApprovalId) {
          const table = ctx.resources.ddb.chatTable;
          await table
            .getDocumentClient()
            .send(
              new UpdateCommand({
                TableName: table.getName(),
                Key: {
                  pk: "COMMAND_APPROVAL",
                  sk: `COMMAND_APPROVAL#${commandApprovalId}`,
                },
                UpdateExpression:
                  "SET logEntryId = :logId, createdAt = :createdAt",
                ExpressionAttributeValues: {
                  ":logId": existing.logId,
                  ":createdAt": existing.createdAt,
                },
              }),
            )
            .catch((err) =>
              ctx.log.error(
                { err, commandApprovalId },
                "Failed to back-fill logEntryId on CommandApproval",
              ),
            );
        }
        await updateAgentLogResult(ctx, existing.logId, existing.createdAt, {
          agentId: opts.agentId,
          taskId: opts.taskId,
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          commandApprovalId,
        });
      } else {
        await writeAgentLog(ctx, {
          agentId: opts.agentId,
          taskId: opts.taskId,
          role: "TOOL",
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          internal: false,
        });
      }
    }
  };

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

  // ── Sentence-streaming TTS ──────────────────────────────────────────
  // Capture speech config up front so closures have narrowed types.
  const speechCfg =
    opts.speech && ctx.serverBaseUrl
      ? {
          voice: opts.speech.voice,
          connectionId: opts.speech.connectionId,
          baseUrl: ctx.serverBaseUrl,
        }
      : null;
  const sentenceAccumulator = speechCfg ? new SentenceAccumulator() : null;
  let sentenceIndex = 0;

  const publishSpeech = (event: SpeechAudioEvent) => {
    if (opts.taskId) {
      ctx.resources.pubsub.publish(`speechAudio:task:${opts.taskId}`, event);
    } else {
      ctx.resources.pubsub.publish(`speechAudio:${opts.agentId}`, event);
    }
  };

  const emitSentence = (sentence: string) => {
    if (!speechCfg) return;
    const cleaned = stripMarkdownForSpeech(sentence);
    if (!cleaned) return;
    const url = buildSpeechUrl(speechCfg.baseUrl, {
      text: cleaned,
      voice: speechCfg.voice,
      connectionId: speechCfg.connectionId,
    });
    publishSpeech({
      logId: streamLogId,
      agentId: opts.agentId,
      sentenceIndex: sentenceIndex++,
      url,
      done: false,
    });
  };

  const modelProvider = typeof model === "string" ? model : model.provider;
  const providerOptions = opts.reasoningEnabled
    ? buildReasoningProviderOptions(modelProvider)
    : undefined;

  const result = streamText({
    model,
    system: systemParts.join("\n\n"),
    messages: opts.messages,
    tools: allTools,
    stopWhen: [hasToolCall("requestUserInput"), () => pendingCommandApproval],
    // biome-ignore lint/suspicious/noExplicitAny: provider options type is too strict for dynamic construction
    providerOptions: providerOptions as any,
    onStepFinish,
    onChunk: ({ chunk }) => {
      if (chunk.type === "reasoning-delta" && chunk.text) {
        publishDelta(chunk.text, false, "reasoning");
      } else if (chunk.type === "text-delta" && chunk.text) {
        publishDelta(chunk.text, false);

        if (sentenceAccumulator) {
          for (const sentence of sentenceAccumulator.push(chunk.text)) {
            emitSentence(sentence);
          }
        }
      }
    },
  });

  // Wait for completion
  const finalText = await result.text;

  // Signal stream complete
  publishDelta("", true);

  // Flush remaining sentence and signal TTS done
  if (sentenceAccumulator) {
    const remaining = sentenceAccumulator.flush();
    if (remaining) emitSentence(remaining);
    publishSpeech({
      logId: streamLogId,
      agentId: opts.agentId,
      sentenceIndex: sentenceIndex,
      url: "",
      done: true,
    });
  }

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
