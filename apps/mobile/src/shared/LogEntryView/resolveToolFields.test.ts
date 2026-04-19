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
      attachments: [],
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
      attachments: [],
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
      attachments: [],
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
      attachments: [],
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
      attachments: [],
      files: [],
    };
    const result = resolveToolFields(entry);
    expect(result.name).toBe("tool");
    expect(result.input).toBeNull();
    expect(result.result).toBeNull();
  });
});

/**
 * Per-tool wire-contract tests.
 *
 * The server unwraps the `GremlinToolResult` envelope before sending
 * `toolResult` to clients — see the `AgentLog.toolResult` resolver and its
 * own tests in `apps/server/src/gql/schema/AgentLog/resolvers.test.ts`.
 * These tests lock in the **post-unwrap** shape that each custom renderer
 * in `LogEntryView/index.tsx` depends on. If a tool renames a field (e.g.
 * `runCommand` `output` → `stdout`), the corresponding test here fails
 * loudly rather than the renderer silently showing an empty card.
 *
 * Coverage scope: only tools with **custom widgets** that read
 * `tool.result.<field>` directly. Tools rendered through the hint-based
 * fallback (readFile, writeFile, taskCreate, attachFile, …) rely on
 * server-computed `displayHint` / `toolError` fields — those are covered
 * by `computeDisplayHint` tests in `@opengremlin/lib`, not here.
 *
 * Payloads below match exactly what each tool returns via `toolOk(...)`
 * after the envelope is stripped.
 */
describe("per-tool wire-contract (post-unwrap shapes)", () => {
  const resolve = (toolName: ToolName, toolResult: string) =>
    resolveToolFields({
      id: "1",
      role: AgentLogRole.Tool,
      content: "",
      createdAt: "",
      toolName,
      toolInput: null,
      toolResult,
      attachments: [],
    }).result;

  it("runCommand completed: exposes output and exitCode", () => {
    const result = resolve(
      ToolName.RunCommand,
      '{"output":"hello world","exitCode":0}',
    );
    expect(result?.output).toBe("hello world");
    expect(result?.exitCode).toBe(0);
  });

  it("runCommand pending: exposes status, commandApprovalId, reason", () => {
    const result = resolve(
      ToolName.RunCommand,
      '{"status":"pending_approval","commandApprovalId":"appr_42","reason":"sudo requires approval"}',
    );
    expect(result?.status).toBe("pending_approval");
    expect(result?.commandApprovalId).toBe("appr_42");
    expect(result?.reason).toBe("sudo requires approval");
  });

  it("requestUserInput: exposes inputRequestId and status", () => {
    const result = resolve(
      ToolName.RequestUserInput,
      '{"inputRequestId":"req_7","status":"pending"}',
    );
    expect(result?.inputRequestId).toBe("req_7");
    expect(result?.status).toBe("pending");
  });

  it("webSearch: result is non-null and JSON-stringifiable (renderer dumps it whole)", () => {
    const result = resolve(
      ToolName.WebSearch,
      '{"results":[{"title":"Example","url":"https://example.com"}]}',
    );
    expect(result).not.toBeNull();
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("webFetch: result is non-null and JSON-stringifiable (renderer dumps it whole)", () => {
    const result = resolve(
      ToolName.WebFetch,
      '{"title":"Page","content":"..."}',
    );
    expect(result).not.toBeNull();
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});
