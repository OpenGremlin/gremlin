import { describe, expect, it } from "vitest";
import { buildMemoryContext } from "./buildMemoryContext.js";

const SAVE_TOOL_LINE =
  "You can save new memories using the saveMemory tool. Entries are appended to today's journal. Use the recallMemory tool to search older memories by query.";

describe("buildMemoryContext", () => {
  it("returns undefined when recent is empty and core is absent", () => {
    expect(buildMemoryContext({ recent: [] })).toBeUndefined();
  });

  it("returns undefined when recent is empty and core is an empty array", () => {
    expect(buildMemoryContext({ recent: [], core: [] })).toBeUndefined();
  });

  it("always starts with the Long-term Memory header when there is content", () => {
    const result = buildMemoryContext({
      recent: [{ date: "2026-03-10", content: "Worked on tests" }],
    });
    expect(result).toMatch(/^## Long-term Memory/);
  });

  it("always ends with the save memory tool instruction", () => {
    const result = buildMemoryContext({
      recent: [{ date: "2026-03-10", content: "Worked on tests" }],
    });
    expect(result).toContain(SAVE_TOOL_LINE);
    expect(result?.endsWith(SAVE_TOOL_LINE)).toBe(true);
  });

  describe("recent journals", () => {
    it("includes the Recent journals section header", () => {
      const result = buildMemoryContext({
        recent: [{ date: "2026-03-10", content: "Worked on tests" }],
      });
      expect(result).toContain("### Recent journals");
    });

    it("formats each entry as [date]:\\ncontent", () => {
      const result = buildMemoryContext({
        recent: [{ date: "2026-03-10", content: "Worked on tests" }],
      });
      expect(result).toContain("[2026-03-10]:\nWorked on tests");
    });

    it("includes multiple recent entries in order", () => {
      const result = buildMemoryContext({
        recent: [
          { date: "2026-03-09", content: "First entry" },
          { date: "2026-03-10", content: "Second entry" },
        ],
      });
      expect(result).toContain("[2026-03-09]:\nFirst entry");
      expect(result).toContain("[2026-03-10]:\nSecond entry");
      const firstIdx = result?.indexOf("[2026-03-09]") ?? -1;
      const secondIdx = result?.indexOf("[2026-03-10]") ?? -1;
      expect(firstIdx).toBeLessThan(secondIdx);
    });

    it("omits the Recent journals section when recent is empty", () => {
      const result = buildMemoryContext({
        recent: [],
        core: [{ tenet: "Some tenet", shapedBy: [] }],
      });
      expect(result).not.toContain("### Recent journals");
    });
  });

  describe("core memories", () => {
    it("includes the Core memories section header when core is non-empty", () => {
      const result = buildMemoryContext({
        recent: [],
        core: [{ tenet: "Prefers brevity", shapedBy: ["asked to be concise"] }],
      });
      expect(result).toContain("### Core memories");
    });

    it("renders each tenet as a bold bullet", () => {
      const result = buildMemoryContext({
        recent: [],
        core: [{ tenet: "Prefers brevity", shapedBy: [] }],
      });
      expect(result).toContain("- **Prefers brevity**");
    });

    it("renders shapedBy entries as indented sub-bullets", () => {
      const result = buildMemoryContext({
        recent: [],
        core: [
          {
            tenet: "Prefers brevity",
            shapedBy: ["asked to be concise", "complained about long replies"],
          },
        ],
      });
      expect(result).toContain("  - asked to be concise");
      expect(result).toContain("  - complained about long replies");
    });

    it("renders multiple core memory entries in order", () => {
      const result = buildMemoryContext({
        recent: [],
        core: [
          { tenet: "First tenet", shapedBy: [] },
          { tenet: "Second tenet", shapedBy: [] },
        ],
      });
      const firstIdx = result?.indexOf("**First tenet**") ?? -1;
      const secondIdx = result?.indexOf("**Second tenet**") ?? -1;
      expect(firstIdx).toBeLessThan(secondIdx);
    });

    it("renders core memories before recent journals", () => {
      const result = buildMemoryContext({
        recent: [{ date: "2026-03-10", content: "Recent entry" }],
        core: [{ tenet: "Some tenet", shapedBy: [] }],
      });
      const coreIdx = result?.indexOf("### Core memories") ?? -1;
      const recentIdx = result?.indexOf("### Recent journals") ?? -1;
      expect(coreIdx).toBeLessThan(recentIdx);
    });

    it("omits the Core memories section when core is undefined", () => {
      const result = buildMemoryContext({
        recent: [{ date: "2026-03-10", content: "Recent entry" }],
      });
      expect(result).not.toContain("### Core memories");
    });
  });
});
