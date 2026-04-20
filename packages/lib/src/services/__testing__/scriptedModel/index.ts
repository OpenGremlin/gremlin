import type {
  LanguageModel,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
} from "@ai-sdk/provider";
import { MockLanguageModelV3 } from "ai/test";

/**
 * A single piece of model output. The LLM can emit any mix of text and tool calls per turn.
 * Tool results are deliberately not scriptable yet — the tool-result typing refactor is pending.
 */
export type ScriptStep =
  | { kind: "text"; text: string }
  | {
      kind: "toolCall";
      toolName: string;
      input: Record<string, unknown>;
      toolCallId?: string;
    };

export type ScriptTurn = ScriptStep[];

/**
 * Build a fake `LanguageModel` that replays a fixed sequence of turns.
 *
 * Each turn is a flat list of text / tool-call steps, corresponding to one SDK call
 * to `doStream`. When the AI SDK loops (model → tool → model → final), it calls
 * `doStream` once per iteration, so pass one turn per iteration.
 *
 *   scriptedModel([
 *     [{ kind: "toolCall", toolName: "shell", input: { cmd: "ls" } }],  // turn 1
 *     [{ kind: "text", text: "All done." }],                             // turn 2
 *   ]);
 */
export function scriptedModel(
  turns: ScriptTurn[],
  opts?: { provider?: string },
): LanguageModel {
  // MockLanguageModelV3's array form indexes off `calls.length` *after* pushing
  // the current call, so array[0] is never returned. Whether that's intentional
  // or not, it doesn't match our zero-indexed usage — drive it via callback form.
  let streamIdx = 0;
  let generateIdx = 0;
  return new MockLanguageModelV3({
    provider: opts?.provider ?? "scripted",
    modelId: "scripted-test-model",
    doStream: async () => {
      const turn = turns[streamIdx++];
      if (!turn) {
        throw new Error(
          `scriptedModel: doStream called ${streamIdx} times but only ${turns.length} turn(s) scripted`,
        );
      }
      return buildStreamResult(turn);
    },
    doGenerate: async () => {
      const turn = turns[generateIdx++];
      if (!turn) {
        throw new Error(
          `scriptedModel: doGenerate called ${generateIdx} times but only ${turns.length} turn(s) scripted`,
        );
      }
      return buildGenerateResult(turn);
    },
  });
}

function buildStreamResult(turn: ScriptTurn): LanguageModelV3StreamResult {
  const parts: LanguageModelV3StreamPart[] = [
    { type: "stream-start", warnings: [] },
  ];

  let textIdx = 0;
  let toolIdx = 0;
  for (const step of turn) {
    if (step.kind === "text") {
      const id = `text-${textIdx++}`;
      parts.push({ type: "text-start", id });
      parts.push({ type: "text-delta", id, delta: step.text });
      parts.push({ type: "text-end", id });
    } else {
      parts.push({
        type: "tool-call",
        toolCallId: step.toolCallId ?? `call-${toolIdx++}`,
        toolName: step.toolName,
        input: JSON.stringify(step.input),
      });
    }
  }

  parts.push({
    type: "finish",
    finishReason: turn.some((s) => s.kind === "toolCall")
      ? "tool-calls"
      : "stop",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  });

  const stream = new ReadableStream<LanguageModelV3StreamPart>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });

  return { stream };
}

function buildGenerateResult(turn: ScriptTurn): LanguageModelV3GenerateResult {
  const content = turn.map((step) => {
    if (step.kind === "text") {
      return { type: "text" as const, text: step.text };
    }
    return {
      type: "tool-call" as const,
      toolCallId: step.toolCallId ?? `call-${crypto.randomUUID()}`,
      toolName: step.toolName,
      input: JSON.stringify(step.input),
    };
  });

  return {
    content,
    finishReason: turn.some((s) => s.kind === "toolCall")
      ? "tool-calls"
      : "stop",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    warnings: [],
  };
}
