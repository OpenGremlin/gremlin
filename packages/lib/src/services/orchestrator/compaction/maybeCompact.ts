import { generateText, type ModelMessage } from "ai";
import type { ServiceContext } from "../../context.js";
import { renderPrompt } from "../../prompts/index.js";
import { getModel } from "../model/index.js";
import { writeAgentLog } from "../writeAgentLog.js";
import type { CompactionEntry } from "./CompactionEntry.js";
import {
  COMPACTION_RATIO,
  COMPACTION_TIMEOUT_MS,
  effectiveInputLimit,
} from "./constants.js";

/**
 * If the context is approaching the model's token limit, summarize older
 * messages into a compaction entry. Designed to be called fire-and-forget.
 */
export async function maybeCompact(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    messages: ModelMessage[];
    contextTokens: number;
    maxInputTokens?: number;
  },
): Promise<void> {
  const limit = effectiveInputLimit(opts.maxInputTokens);
  if (opts.contextTokens < limit * COMPACTION_RATIO) return;

  const toSummarize = opts.messages;

  // Format as a transcript for the summarizer
  const transcript = toSummarize
    .map(
      (m) =>
        `[${m.role}]: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`,
    )
    .join("\n\n");

  const result = await generateText({
    model: await getModel(ctx),
    system: renderPrompt("compaction"),
    messages: [{ role: "user", content: transcript }],
    abortSignal: AbortSignal.timeout(COMPACTION_TIMEOUT_MS),
  });

  if (!result.text) return;

  let summary: string;
  let memories: string[] = [];

  try {
    const parsed = JSON.parse(result.text);
    summary = parsed.summary;
    memories = parsed.memories ?? [];
  } catch {
    // Model didn't return valid JSON — use raw text as summary
    summary = result.text;
  }

  const compactionContent: CompactionEntry = {
    type: "compaction",
    summary,
    compactedCount: toSummarize.length,
  };

  await writeAgentLog(ctx, {
    agentId: opts.agentId,
    taskId: opts.taskId,
    role: "SYSTEM",
    content: JSON.stringify(compactionContent),
  });

  // Save extracted memories (if any)
  if (memories.length > 0) {
    const content = memories.join("\n");
    await ctx.services.memory
      .saveMemory(ctx, opts.agentId, content)
      .catch((err) =>
        ctx.log.error(
          { err, component: "compaction" },
          "Memory save during compaction failed",
        ),
      );
  }
}
