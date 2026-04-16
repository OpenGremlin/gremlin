export interface CompactionEntry {
  type: "compaction";
  summary: string;
  compactedCount: number;
}

export function isCompactionEntry(content: string): CompactionEntry | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "compaction")
      return parsed as CompactionEntry;
  } catch {
    // not JSON or not a compaction entry
  }
  return null;
}
