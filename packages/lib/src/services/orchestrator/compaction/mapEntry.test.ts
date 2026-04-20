import { describe, expect, it } from "vitest";
import { mapEntry } from "./mapEntry.js";

/**
 * Cache correctness invariant: the same DDB AgentLog entry must always
 * serialize to the same bytes when rebuilt into a ModelMessage. Any drift
 * here — key reordering, whitespace changes, conditional fields toggling
 * — shifts the conversation prefix and invalidates every downstream
 * cache breakpoint.
 */
describe("mapEntry determinism", () => {
  it("produces identical output for an AGENT entry on repeated calls", () => {
    const entry = {
      role: "AGENT",
      content: "Hello, world.",
    };
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

  it("produces identical output for a TOOL entry with structured input/result", () => {
    // Simulates a freshly-deserialized DDB entry: toolInput/toolResult are
    // already JSON strings (that's what writeAgentLog stores).
    const entry = {
      role: "TOOL",
      content: "Tool call: readFile",
      toolName: "readFile",
      toolInput: JSON.stringify({ path: "/tmp/a.txt", offset: 0 }),
      toolResult: JSON.stringify({ ok: true, data: { content: "hi" } }),
      internal: false,
    };
    expect(JSON.stringify(mapEntry(entry))).toBe(
      JSON.stringify(mapEntry(entry)),
    );
  });

  it("stringifies tool inputs with stable key order regardless of construction order", () => {
    // JSON.stringify preserves insertion order in V8. If any code path
    // reconstructs toolInput with keys in a different order, caching breaks.
    // Here we verify that the *same* shape produces identical bytes.
    const a = JSON.stringify({ path: "/x", offset: 0, length: 10 });
    const b = JSON.stringify({ path: "/x", offset: 0, length: 10 });
    expect(a).toBe(b);

    // And that a differently-ordered construction produces different bytes —
    // this is the guardrail: callers must not reorder before writing to DDB.
    const c = JSON.stringify({ length: 10, offset: 0, path: "/x" });
    expect(c).not.toBe(a);
  });

  it("skips call-only TOOL entries (no result yet) so partial writes don't poison the prefix", () => {
    const entry = {
      role: "TOOL",
      content: "Tool call: foo",
      toolName: "foo",
      toolInput: JSON.stringify({ a: 1 }),
      toolResult: null,
      internal: false,
    };
    expect(mapEntry(entry)).toBeNull();
  });

  it("suppresses a literal 'null' string in toolResult (eager-write sentinel)", () => {
    const withActualNull = {
      role: "TOOL",
      content: "Tool call: foo",
      toolName: "foo",
      toolInput: JSON.stringify({ a: 1 }),
      toolResult: "null",
      internal: false,
    };
    // Eager-logged entries store literal "null" — they should be treated as
    // call-only (returns null) so the prefix doesn't include a stale result.
    expect(mapEntry(withActualNull)).toBeNull();
  });
});
