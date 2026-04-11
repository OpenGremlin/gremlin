import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getWorkspacePath, resolveWorkspacePath } from "./workspacePath.js";

describe("getWorkspacePath", () => {
  const original = process.env.WORKSPACE_PATH;

  afterEach(() => {
    if (original !== undefined) {
      process.env.WORKSPACE_PATH = original;
    } else {
      delete process.env.WORKSPACE_PATH;
    }
  });

  it("returns WORKSPACE_PATH when set", () => {
    process.env.WORKSPACE_PATH = "/tmp/my-workspace";
    expect(getWorkspacePath()).toBe("/tmp/my-workspace");
  });

  it("defaults to /workspace when env var is not set", () => {
    delete process.env.WORKSPACE_PATH;
    expect(getWorkspacePath()).toBe("/workspace");
  });
});

describe("resolveWorkspacePath", () => {
  const original = process.env.WORKSPACE_PATH;

  beforeEach(() => {
    process.env.WORKSPACE_PATH = "/workspace";
  });

  afterEach(() => {
    if (original !== undefined) {
      process.env.WORKSPACE_PATH = original;
    } else {
      delete process.env.WORKSPACE_PATH;
    }
  });

  it("resolves a simple relative path", () => {
    expect(resolveWorkspacePath("docs/readme.md")).toBe(
      "/workspace/docs/readme.md",
    );
  });

  it("resolves a nested path", () => {
    expect(resolveWorkspacePath("a/b/c")).toBe("/workspace/a/b/c");
  });

  it("returns null for empty string (workspace root)", () => {
    expect(resolveWorkspacePath("")).toBeNull();
  });

  it("returns null for path traversal outside workspace", () => {
    expect(resolveWorkspacePath("../etc/passwd")).toBeNull();
  });

  it("returns null for absolute path outside workspace", () => {
    expect(resolveWorkspacePath("/etc/passwd")).toBeNull();
  });

  it("returns null for tricky traversal that stays as prefix", () => {
    // /workspace/../workspace-evil → /workspace-evil
    expect(resolveWorkspacePath("../workspace-evil")).toBeNull();
  });

  it("returns null for dot path (workspace root)", () => {
    expect(resolveWorkspacePath(".")).toBeNull();
  });

  it("allows valid subdirectory path", () => {
    expect(resolveWorkspacePath("subdir")).toBe("/workspace/subdir");
  });
});
