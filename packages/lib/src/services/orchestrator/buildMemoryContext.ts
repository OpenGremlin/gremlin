import type { CoreMemory } from "../memory/index.js";

interface MemoryEntry {
  date: string;
  content: string;
}

interface Memories {
  recent: MemoryEntry[];
  core?: CoreMemory[];
}

export function buildMemoryContext(memories: Memories): string | undefined {
  const hasCore = memories.core && memories.core.length > 0;
  if (memories.recent.length === 0 && !hasCore) {
    return undefined;
  }

  const lines: string[] = ["## Long-term Memory"];

  if (hasCore) {
    lines.push("### Core memories");
    lines.push(
      "These are your deeply held tenets about the user, distilled from past experiences.",
    );
    for (const cm of memories.core ?? []) {
      lines.push(`- **${cm.tenet}**`);
      if (cm.shapedBy.length > 0) {
        for (const s of cm.shapedBy) {
          lines.push(`  - ${s}`);
        }
      }
    }
    lines.push("");
  }

  if (memories.recent.length > 0) {
    lines.push("### Recent journals");
    for (const m of memories.recent) {
      lines.push(`[${m.date}]:\n${m.content}`);
    }
  }
  lines.push(
    "",
    "You can save new memories using the saveMemory tool. Entries are appended to today's journal. Use the recallMemory tool to search older memories by query.",
  );
  return lines.join("\n");
}
