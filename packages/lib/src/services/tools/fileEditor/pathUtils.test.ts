import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getWorkspacePath, resolveAndValidate } from "./pathUtils.js";

describe("pathUtils", () => {
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(() => {
    process.env.WORKSPACE_PATH = "/workspace";
  });

  afterEach(() => {
    process.env.WORKSPACE_PATH = originalEnv;
  });

  describe("getWorkspacePath", () => {
    it("returns WORKSPACE_PATH from env", () => {
      process.env.WORKSPACE_PATH = "/custom/workspace";
      expect(getWorkspacePath()).toBe("/custom/workspace");
    });

    it("defaults to /workspace when env is unset", () => {
      delete process.env.WORKSPACE_PATH;
      expect(getWorkspacePath()).toBe("/workspace");
    });
  });

  describe("resolveAndValidate", () => {
    it("resolves relative paths against workspace", () => {
      const result = resolveAndValidate("src/index.ts");
      expect(result).toBe("/workspace/src/index.ts");
    });

    it("resolves nested relative paths", () => {
      const result = resolveAndValidate("a/b/c.txt");
      expect(result).toBe("/workspace/a/b/c.txt");
    });

    it("rejects paths that escape workspace via ..", () => {
      expect(() => resolveAndValidate("../outside")).toThrow(
        "Path traversal not allowed",
      );
    });

    it("rejects absolute paths outside workspace", () => {
      expect(() => resolveAndValidate("/etc/passwd")).toThrow(
        "Path traversal not allowed",
      );
    });

    it("allows absolute paths within workspace", () => {
      const result = resolveAndValidate("/workspace/file.txt");
      expect(result).toBe("/workspace/file.txt");
    });

    it("rejects sneaky traversal like foo/../../outside", () => {
      expect(() => resolveAndValidate("foo/../../outside")).toThrow(
        "Path traversal not allowed",
      );
    });
  });

  describe("resolveAndValidate with non-default WORKSPACE_PATH", () => {
    beforeEach(() => {
      process.env.WORKSPACE_PATH = "/home/user/data";
    });

    it("strips /workspace prefix and resolves against real workspace", () => {
      const result = resolveAndValidate("/workspace/file.txt");
      expect(result).toBe("/home/user/data/file.txt");
    });

    it("strips /workspace prefix for nested paths", () => {
      const result = resolveAndValidate("/workspace/src/components/App.tsx");
      expect(result).toBe("/home/user/data/src/components/App.tsx");
    });

    it("strips bare /workspace path", () => {
      const result = resolveAndValidate("/workspace");
      expect(result).toBe("/home/user/data");
    });

    it("does not strip /workspace-other (similar prefix)", () => {
      expect(() => resolveAndValidate("/workspace-other/file.txt")).toThrow(
        "Path traversal not allowed",
      );
    });

    it("resolves relative paths against real workspace", () => {
      const result = resolveAndValidate("docs/readme.md");
      expect(result).toBe("/home/user/data/docs/readme.md");
    });

    it("rejects /workspace/../etc/passwd after stripping", () => {
      expect(() => resolveAndValidate("/workspace/../etc/passwd")).toThrow(
        "Path traversal not allowed",
      );
    });
  });
});
