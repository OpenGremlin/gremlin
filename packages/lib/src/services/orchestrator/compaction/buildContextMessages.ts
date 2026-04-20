import type { ModelMessage } from "ai";
import type { ServiceContext } from "../../context.js";
import { type CompactionEntry, isCompactionEntry } from "./CompactionEntry.js";
import { compactToolResult } from "./compactToolResult.js";
import { mapEntry } from "./mapEntry.js";

type ToolCtx = Pick<ServiceContext, "log">;

interface ToolLogEntry {
  id: string;
  role: "TOOL";
  toolName?: string | null;
  toolInput?: string | null;
  toolResult?: string | null;
  internal?: boolean;
}

function isEmittableToolEntry(e: {
  role: string;
  toolResult?: string | null;
  internal?: boolean;
}): e is ToolLogEntry {
  if (e.role !== "TOOL") return false;
  if (e.internal) return false;
  // Skip call-only entries (tool still in flight) and the eager-log null
  // sentinel string. Only entries with a real result participate in history.
  if (e.toolResult == null || e.toolResult === "null") return false;
  return true;
}

/**
 * Emit a consecutive run of TOOL entries as proper AI SDK content parts:
 * one assistant message carrying all tool-calls, followed by one tool
 * message carrying all tool-results. Using the log entry id as toolCallId
 * keeps the byte representation stable across replays, which is required
 * for prompt caching.
 */
function flushToolBuffer(
  ctx: ToolCtx,
  buffer: ToolLogEntry[],
  messages: ModelMessage[],
): void {
  if (buffer.length === 0) return;

  const toolCalls = buffer.map((e) => {
    let input: unknown;
    try {
      input = e.toolInput ? JSON.parse(e.toolInput) : {};
    } catch (err) {
      // writeAgentLog always JSON.stringify()s tool inputs, so invalid JSON
      // here means the row was corrupted (bad migration, manual edit,
      // legacy entry). Log it — silent fallback hides regressions.
      ctx.log.warn(
        { err, entryId: e.id, toolName: e.toolName },
        "TOOL entry has unparseable toolInput; using raw string fallback",
      );
      input = { raw: e.toolInput };
    }
    return {
      type: "tool-call" as const,
      toolCallId: e.id,
      toolName: e.toolName ?? "unknown",
      input,
    };
  });

  const toolResults = buffer.map((e) => {
    const raw = e.toolResult ?? "";
    const compacted = compactToolResult(e.toolName ?? "unknown", raw);
    return {
      type: "tool-result" as const,
      toolCallId: e.id,
      toolName: e.toolName ?? "unknown",
      // AI SDK v5 `ToolResultOutput` uses `value` (not `text`) — see
      // @ai-sdk/provider-utils ToolResultOutput. Using the text variant
      // with the stored JSON string (or compacted summary) keeps the wire
      // bytes deterministic across replays, which is required for caching.
      output: { type: "text" as const, value: compacted ?? raw },
    };
  });

  messages.push({
    role: "assistant",
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool-call content type
    content: toolCalls as any,
  });
  messages.push({
    role: "tool",
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool-result content type
    content: toolResults as any,
  });

  buffer.length = 0;
}

/**
 * Build context messages from agent logs, using compaction summaries
 * when available to keep context size bounded.
 *
 * Consecutive TOOL entries are grouped into a single assistant tool-call
 * message + tool tool-result message (AI SDK shape). This is both more
 * faithful than the old prose-wrapper representation and noticeably
 * cheaper in tokens.
 */
export async function buildContextMessages(
  ctx: ServiceContext,
  opts: { agentId: string; taskId: string | null },
): Promise<{ messages: ModelMessage[] }> {
  const connection = opts.taskId
    ? await ctx.services.agentLogs.getTaskLogs(ctx, opts.taskId, { first: 200 })
    : await ctx.services.agentLogs.getAgentLogs(ctx, opts.agentId, {
        first: 200,
      });

  const entries = connection.edges.map((e) => e.node);

  // Reverse-scan for the most recent compaction entry
  let compactionIndex = -1;
  let cachedCompaction: CompactionEntry | null = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].role === "SYSTEM") {
      const parsed = isCompactionEntry(entries[i].content);
      if (parsed) {
        compactionIndex = i;
        cachedCompaction = parsed;
        break;
      }
    }
  }

  const messages: ModelMessage[] = [];
  const toolBuffer: ToolLogEntry[] = [];

  const start = compactionIndex >= 0 ? compactionIndex + 1 : 0;

  if (compactionIndex >= 0) {
    messages.push({
      role: "user",
      content: `[Context summary of earlier conversation]\n\n${cachedCompaction?.summary}`,
    });
  }

  for (let i = start; i < entries.length; i++) {
    const entry = entries[i];
    if (isEmittableToolEntry(entry)) {
      toolBuffer.push(entry);
      continue;
    }
    // Non-TOOL (or unemittable TOOL) — flush buffered tool calls first.
    flushToolBuffer(ctx, toolBuffer, messages);
    const mapped = mapEntry(entry);
    if (mapped) messages.push(mapped);
  }
  flushToolBuffer(ctx, toolBuffer, messages);

  return { messages };
}
