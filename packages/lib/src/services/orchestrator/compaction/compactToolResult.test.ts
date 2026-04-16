import { describe, expect, it } from "vitest";
import { compactToolResult } from "./compactToolResult.js";
import { TOOL_RESULT_COMPACT_THRESHOLD } from "./constants.js";

describe("compactToolResult", () => {
  it("returns null for non-compactable tools", () => {
    expect(compactToolResult("readFile", "x".repeat(10_000))).toBeNull();
    expect(compactToolResult("grep", "x".repeat(10_000))).toBeNull();
  });

  it("returns null when below the threshold", () => {
    const small = JSON.stringify({ exitCode: 0, output: "hi" });
    expect(compactToolResult("runCommand", small)).toBeNull();
  });

  it("returns null when JSON is invalid (fallthrough)", () => {
    const invalid = "not-json-".repeat(TOOL_RESULT_COMPACT_THRESHOLD);
    expect(compactToolResult("runCommand", invalid)).toBeNull();
  });

  it("produces a compact summary above the threshold", () => {
    const bigOutput = "a".repeat(5_000);
    const resultJson = JSON.stringify({
      exitCode: 0,
      output: bigOutput,
      outputTruncated: false,
    });
    const out = compactToolResult("runCommand", resultJson);
    expect(out).toContain('"exitCode":0');
    expect(out).toContain('"outputChars":5000');
    expect(out).toMatch(/Preview: a{200}\.\.\./);
  });

  it("marks truncated outputs and mentions readCommandOutput", () => {
    const resultJson = JSON.stringify({
      exitCode: 1,
      output: "x".repeat(3_000),
      outputTruncated: true,
      commandId: "cmd-xyz",
    });
    const out = compactToolResult("runCommand", resultJson);
    expect(out).not.toBeNull();
    expect(out).toContain("(truncated)");
    expect(out).toContain('readCommandOutput("cmd-xyz")');
    expect(out).toContain('"exitCode":1');
  });

  it("uses ? for exitCode when missing", () => {
    const resultJson = JSON.stringify({
      output: "x".repeat(3_000),
    });
    const out = compactToolResult("runCommand", resultJson);
    expect(out).not.toBeNull();
    expect(out).toContain('"exitCode":?');
  });

  it("omits preview when output is missing", () => {
    // Without an `output` field the preview suffix should be empty.
    const resultJson = JSON.stringify({
      exitCode: 0,
      filler: "z".repeat(3_000),
    });
    const out = compactToolResult("runCommand", resultJson);
    expect(out).not.toBeNull();
    expect(out).not.toContain("Preview:");
    expect(out).toContain('"outputChars":0');
  });
});
