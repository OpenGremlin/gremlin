import { generateText, type ModelMessage } from "ai";
import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { getModel } from "./model.js";
import { writeAgentLog } from "./writeAgentLog.js";

const COMPACTION_THRESHOLD = 40;

interface CompactionEntry {
  type: "compaction";
  summary: string;
  compactedCount: number;
}

function isCompactionEntry(content: string): CompactionEntry | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "compaction")
      return parsed as CompactionEntry;
  } catch {
    // not JSON or not a compaction entry
  }
  return null;
}

/**
 * Build context messages from agent logs, using compaction summaries
 * when available to keep context size bounded.
 */
export async function buildContextMessages(
  ctx: ServiceContext,
  opts: { agentId: string; taskId: string | null },
): Promise<{ messages: ModelMessage[]; postCompactionCount: number }> {
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

  if (compactionIndex >= 0) {
    messages.push({
      role: "user",
      content: `[Context summary of earlier conversation]\n\n${cachedCompaction?.summary}`,
    });
    for (let i = compactionIndex + 1; i < entries.length; i++) {
      const mapped = mapEntry(entries[i]);
      if (mapped) messages.push(mapped);
    }
  } else {
    for (const entry of entries) {
      const mapped = mapEntry(entry);
      if (mapped) messages.push(mapped);
    }
  }

  // Count entries after last compaction (for deciding when to compact next)
  const postCompactionCount =
    compactionIndex >= 0
      ? entries.length - compactionIndex - 1
      : entries.length;

  return { messages, postCompactionCount };
}

function mapEntry(node: {
  role: string;
  content: string;
  toolName?: string | null;
  toolInput?: string | null;
  toolResult?: string | null;
  internal?: boolean;
}): ModelMessage | null {
  if (node.role === "AGENT") {
    return { role: "assistant", content: node.content };
  }
  if (node.role === "USER") {
    return { role: "user", content: node.content };
  }
  if (node.role === "SYSTEM") {
    return { role: "user", content: node.content };
  }
  if (node.role === "TOOL" && !node.internal) {
    // Include tool calls as system context so the model knows what it already did.
    // Using "user" role to avoid the model mimicking the format in its own output.
    const name = node.toolName ?? "unknown";
    const input = node.toolInput ?? "";
    const result =
      node.toolResult && node.toolResult !== "null" ? node.toolResult : null;
    if (result) {
      return {
        role: "user",
        content: `[System: you called ${name} with ${input} and got: ${result}]`,
      };
    }
    // Call-only entry (no result yet) — skip
    return null;
  }
  return null;
}

/**
 * If enough messages have accumulated, summarize older ones into a
 * compaction entry. Designed to be called fire-and-forget.
 */
export async function maybeCompact(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    messages: ModelMessage[];
    postCompactionCount: number;
  },
): Promise<void> {
  if (opts.postCompactionCount < COMPACTION_THRESHOLD) return;

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
