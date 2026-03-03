import { generateText, type ModelMessage } from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "./model.js";
import { writeAgentLog } from "./writeAgentLog.js";

const COMPACTION_THRESHOLD = 40;

const SUMMARIZATION_PROMPT = `You are a conversation summarizer. Given a transcript of messages between a user and an AI assistant, produce a JSON response with two fields:

{
  "summary": "...",
  "memories": ["...", "..."]
}

For "summary": produce a concise summary that preserves:
- Key facts, decisions, and context established
- Any ongoing tasks, goals, or instructions
- Important names, IDs, and references
- The current state of the conversation

For "memories": extract things worth remembering long-term across future conversations. Each entry should be a short, specific, standalone fact. Examples:
- "User prefers concise responses without bullet points"
- "Project uses pnpm monorepo with apps/ and packages/ dirs"
- "User's timezone is PST, works 9am-5pm"
- "Decided to use S3 Vectors instead of DynamoDB for memory storage"

If nothing is worth remembering long-term, return an empty array. Only extract durable facts — not transient conversation state.

Respond with valid JSON only.`;

interface CompactionEntry {
  type: "compaction";
  summary: string;
  compactedCount: number;
}

function isCompactionEntry(content: string): CompactionEntry | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "compaction") return parsed as CompactionEntry;
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
): Promise<{ messages: ModelMessage[]; totalLogCount: number }> {
  const connection = opts.taskId
    ? await ctx.services.agentLogs.getTaskLogs(ctx, opts.taskId, { first: 200 })
    : await ctx.services.agentLogs.getAgentLogs(ctx, opts.agentId, {
        first: 200,
      });

  const entries = connection.edges.map((e) => e.node);
  const totalLogCount = entries.length;

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
      content: `[Context summary of earlier conversation]\n\n${cachedCompaction!.summary}`,
    });
    // Map all entries after the compaction point
    for (let i = compactionIndex + 1; i < entries.length; i++) {
      const mapped = mapEntry(entries[i]);
      if (mapped) messages.push(mapped);
    }
  } else {
    // No compaction found — map all entries
    for (const entry of entries) {
      const mapped = mapEntry(entry);
      if (mapped) messages.push(mapped);
    }
  }

  return { messages, totalLogCount };
}

function mapEntry(node: {
  role: string;
  content: string;
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
  // Skip tool entries
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
    totalLogCount: number;
  },
): Promise<void> {
  if (opts.totalLogCount < COMPACTION_THRESHOLD) return;

  const toSummarize = opts.messages;

  // Format as a transcript for the summarizer
  const transcript = toSummarize
    .map((m) => `[${m.role}]: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
    .join("\n\n");

  const result = await generateText({
    model: await getModel(ctx),
    system: SUMMARIZATION_PROMPT,
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
      .catch((err) => console.error("memory save during compaction failed:", err));
  }
}
