import { describe, expect, it } from "vitest";
import { AgentLogRole, ToolName } from "../../graphql/generated/graphql";
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
      role: AgentLogRole.Tool,
      content: "ignored",
      createdAt: "",
      toolName: ToolName.RunCommand,
      toolInput: '{"command":"ls"}',
      toolResult: '{"output":"file.txt"}',
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("runCommand");
    expect(result.input).toEqual({ command: "ls" });
    expect(result.result).toEqual({ output: "file.txt" });
  });

  it("handles null toolInput/toolResult with typed fields", () => {
    const entry = {
      id: "1",
      role: AgentLogRole.Tool,
      content: "",
      createdAt: "",
      toolName: ToolName.SaveMemory,
      toolInput: null,
      toolResult: null,
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("saveMemory");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });

  it("falls back to legacy JSON-in-content format", () => {
    const entry = {
      id: "1",
      role: AgentLogRole.Tool,
      content: JSON.stringify({
        name: "legacyTool",
        input: { foo: "bar" },
        result: { ok: true },
      }),
      createdAt: "",
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("legacyTool");
    expect(result.input).toEqual({ foo: "bar" });
    expect(result.result).toEqual({ ok: true });
  });

  it("returns default when content is not a tool object", () => {
    const entry = {
      id: "1",
      role: AgentLogRole.Tool,
      content: '{"type":"something_else"}',
      createdAt: "",
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("tool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });

  it("returns default when content is not JSON", () => {
    const entry = {
      id: "1",
      role: AgentLogRole.Tool,
      content: "plain text",
      createdAt: "",
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("tool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });
});
