import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../../../../hooks/useLogMessages";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";

function makeToolMsg(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: "1",
    role: "TOOL",
    content: "",
    createdAt: "2024-01-01T12:00:00Z",
    toolName: null,
    toolInput: null,
    toolResult: null,
    taskId: null,
    agent: {
      id: "a1",
      name: "Bot",
      avatar: "",
      imageUrl: "",
      portraitId: "",
      soul: "",
      retired: false,
    },
    ...overrides,
  } as ChatMessage;
}

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("not json")).toBe(null);
  });

  it("returns null for null/undefined", () => {
    expect(safeParseJson(null)).toBe(null);
    expect(safeParseJson(undefined)).toBe(null);
  });
});

describe("resolveToolFields", () => {
  it("uses typed columns when toolName is present", () => {
    const entry = makeToolMsg({
      toolName: "runCommand",
      toolInput: '{"command":"ls"}',
      toolResult: '{"output":"file.txt"}',
    });
    expect(resolveToolFields(entry)).toEqual({
      name: "runCommand",
      input: { command: "ls" },
      result: { output: "file.txt" },
    });
  });

  it("handles typed columns with null input/result", () => {
    const entry = makeToolMsg({ toolName: "myTool" });
    expect(resolveToolFields(entry)).toEqual({
      name: "myTool",
      input: null,
      result: null,
    });
  });

  it("falls back to legacy JSON-in-content", () => {
    const entry = makeToolMsg({
      content: JSON.stringify({
        name: "legacyTool",
        input: { foo: "bar" },
        result: { ok: true },
      }),
    });
    expect(resolveToolFields(entry)).toEqual({
      name: "legacyTool",
      input: { foo: "bar" },
      result: { ok: true },
    });
  });

  it("returns default when content is not parseable tool JSON", () => {
    const entry = makeToolMsg({ content: "just some text" });
    expect(resolveToolFields(entry)).toEqual({
      name: "tool",
      input: null,
      result: null,
    });
  });

  it("returns default for empty content", () => {
    const entry = makeToolMsg({ content: "" });
    expect(resolveToolFields(entry)).toEqual({
      name: "tool",
      input: null,
      result: null,
    });
  });
});
