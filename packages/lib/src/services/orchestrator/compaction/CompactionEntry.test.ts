import { describe, expect, it } from "vitest";
import { isCompactionEntry } from "./CompactionEntry.js";

describe("isCompactionEntry", () => {
  it("parses a valid compaction entry", () => {
    const raw = JSON.stringify({
      type: "compaction",
      summary: "Talked about bananas.",
      compactedCount: 10,
    });
    expect(isCompactionEntry(raw)).toEqual({
      type: "compaction",
      summary: "Talked about bananas.",
      compactedCount: 10,
    });
  });

  it("returns null for JSON that isn't a compaction entry", () => {
    expect(isCompactionEntry('{"type":"other"}')).toBeNull();
    expect(isCompactionEntry('{"summary":"hello"}')).toBeNull();
    expect(isCompactionEntry("null")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(isCompactionEntry("not-json")).toBeNull();
    expect(isCompactionEntry("")).toBeNull();
  });
});
