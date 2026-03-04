interface MemoryEntry {
  date: string;
  content: string;
}

interface Memories {
  recent: MemoryEntry[];
  relevant: MemoryEntry[];
}

export function buildMemoryContext(memories: Memories): string | undefined {
  if (memories.recent.length === 0 && memories.relevant.length === 0) {
    return undefined;
  }

  const lines: string[] = ["## Long-term Memory"];
  if (memories.recent.length > 0) {
    lines.push("### Recent journals");
    for (const m of memories.recent) {
      lines.push(`[${m.date}]:\n${m.content}`);
    }
  }
  if (memories.relevant.length > 0) {
    lines.push("");
    lines.push("### Relevant past memories");
    for (const m of memories.relevant) {
      lines.push(`[${m.date}]:\n${m.content}`);
    }
  }
  lines.push(
    "",
    "You can save new memories using the saveMemory tool. Entries are appended to today's journal.",
  );
  return lines.join("\n");
}
