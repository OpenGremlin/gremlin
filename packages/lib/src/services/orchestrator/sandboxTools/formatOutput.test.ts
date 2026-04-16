import { describe, expect, it } from "vitest";
import { formatOutput } from "./formatOutput.js";

describe("formatOutput", () => {
  it("returns stdout unchanged when stderr is empty", () => {
    expect(formatOutput("hello\nworld", "", 0)).toBe("hello\nworld");
  });

  it("puts stderr first on non-zero exit so the error leads", () => {
    expect(formatOutput("some output", "boom", 1)).toBe(
      "[stderr]\nboom\n\n[stdout]\nsome output",
    );
  });

  it("appends stderr after stdout when exit code is zero", () => {
    expect(formatOutput("ok", "warning: something", 0)).toBe(
      "ok\n\n[stderr]\nwarning: something",
    );
  });

  it("handles empty stdout + stderr", () => {
    expect(formatOutput("", "", 0)).toBe("");
  });

  it("handles empty stdout but populated stderr on success (odd but possible)", () => {
    expect(formatOutput("", "diag", 0)).toBe("\n\n[stderr]\ndiag");
  });

  it("handles empty stdout + stderr on failure", () => {
    expect(formatOutput("", "bad", 127)).toBe("[stderr]\nbad\n\n[stdout]\n");
  });
});
