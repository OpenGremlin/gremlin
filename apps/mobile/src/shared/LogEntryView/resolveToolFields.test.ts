import { describe, expect, it } from "vitest";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("not json")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(safeParseJson(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeParseJson(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeParseJson("")).toBeNull();
  });
});

describe("resolveToolFields", () => {
  it("uses typed fields when toolName is present", () => {
    const entry = {
      id: "1",
      role: "TOOL" as const,
      content: "ignored",
      createdAt: "",
      toolName: "runCommand",
      toolInput: '{"command":"ls"}',
      toolResult: '{"output":"file.txt"}',
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("runCommand");
    expect(result.input).toEqual({ command: "ls" });
    expect(result.result).toEqual({ output: "file.txt" });
  });

  it("handles null toolInput/toolResult with typed fields", () => {
    const entry = {
      id: "1",
      role: "TOOL" as const,
      content: "",
      createdAt: "",
      toolName: "myTool",
      toolInput: null,
      toolResult: null,
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("myTool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });

  it("falls back to legacy JSON-in-content format", () => {
    const entry = {
      id: "1",
      role: "TOOL" as const,
      content: JSON.stringify({
        name: "legacyTool",
        input: { foo: "bar" },
        result: { ok: true },
      }),
      createdAt: "",
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("legacyTool");
    expect(result.input).toEqual({ foo: "bar" });
    expect(result.result).toEqual({ ok: true });
  });

  it("returns default when content is not a tool object", () => {
    const entry = {
      id: "1",
      role: "TOOL" as const,
      content: '{"type":"something_else"}',
      createdAt: "",
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("tool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });

  it("returns default when content is not JSON", () => {
    const entry = {
      id: "1",
      role: "TOOL" as const,
      content: "plain text",
      createdAt: "",
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("tool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });
});
