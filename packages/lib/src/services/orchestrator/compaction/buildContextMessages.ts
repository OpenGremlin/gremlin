import type { ModelMessage } from "ai";
import type { ServiceContext } from "../../context.js";
import { type CompactionEntry, isCompactionEntry } from "./CompactionEntry.js";
import { mapEntry } from "./mapEntry.js";

/**
 * Build context messages from agent logs, using compaction summaries
 * when available to keep context size bounded.
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

  return { messages };
}
