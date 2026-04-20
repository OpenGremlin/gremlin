import { describe, expect, it } from "vitest";
import { mapEntry } from "./mapEntry.js";

/**
 * Cache correctness invariant: the same DDB AgentLog entry must always
 * serialize to the same bytes. TOOL entries are now grouped in
 * buildContextMessages.ts (proper tool-call / tool-result content parts);
 * mapEntry only handles the text-role entries here.
 */
describe("mapEntry determinism", () => {
  it("produces identical output for an AGENT entry on repeated calls", () => {
    const entry = { role: "AGENT", content: "Hello, world." };
    expect(JSON.stringify(mapEntry(entry))).toBe(
      JSON.stringify(mapEntry(entry)),
    );
  });

  it("produces identical output for a USER entry with attachments", () => {
    const entry = {
      role: "USER",
      content: "check this out",
      attachments: [{ type: "file", path: "a.md" }],
    };
    expect(JSON.stringify(mapEntry(entry))).toBe(
      JSON.stringify(mapEntry(entry)),
    );
  });

  it("renders SYSTEM entries as user messages", () => {
    const entry = { role: "SYSTEM", content: "background context" };
    expect(mapEntry(entry)).toEqual({
      role: "user",
      content: "background context",
    });
  });

  it("returns null for TOOL entries (handled in buildContextMessages)", () => {
    const entry = {
      role: "TOOL",
      content: "Tool call: readFile",
    };
    expect(mapEntry(entry)).toBeNull();
  });
});
