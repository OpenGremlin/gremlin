import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { FileStateTracker } from "./fileState.js";
import { writeFileTool } from "./writeFileTool.js";

describe("writeFileTool", () => {
  let tmpDir: string;
  let tracker: FileStateTracker;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "writefile-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
    tracker = new FileStateTracker();
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  function createTool() {
    const ctx = createMockContext();
    return writeFileTool(ctx, tracker, null);
  }

  it("creates a new file", async () => {
    const t = createTool();
    const result = (await t.execute(
      { file_path: "new.txt", content: "hello world" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      type: "create",
      path: path.join(tmpDir, "new.txt"),
    });
    const content = await fsp.readFile(path.join(tmpDir, "new.txt"), "utf-8");
    expect(content).toBe("hello world");
  });

  it("creates parent directories automatically", async () => {
    const t = createTool();
    await t.execute(
      { file_path: "a/b/c/file.ts", content: "export {}" },
      {} as any,
    );
    const content = await fsp.readFile(
      path.join(tmpDir, "a/b/c/file.ts"),
      "utf-8",
    );
    expect(content).toBe("export {}");
  });

  it("overwrites an existing file after reading it", async () => {
    const filePath = path.join(tmpDir, "exists.txt");
    await fsp.writeFile(filePath, "old content");

    // Must read first
    tracker.recordRead(filePath, "old content", false);

    const t = createTool();
    const result = (await t.execute(
      { file_path: "exists.txt", content: "new content" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ type: "update" });
    const content = await fsp.readFile(filePath, "utf-8");
    expect(content).toBe("new content");
  });

  it("rejects overwriting without prior read", async () => {
    const filePath = path.join(tmpDir, "exists.txt");
    await fsp.writeFile(filePath, "old content");

    const t = createTool();
    const result = (await t.execute(
      { file_path: "exists.txt", content: "new content" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("PROTOCOL_VIOLATION");
    expect(result.error.message).toContain("has not been read yet");
    expect(result.error.hint).toBeDefined();
  });

  it("rejects path traversal", async () => {
    const t = createTool();
    const result = (await t.execute(
      { file_path: "../../escape.txt", content: "bad" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("PATH_INVALID");
    expect(result.error.message).toContain("Path traversal not allowed");
  });

  it("clears state after write so re-read is required", async () => {
    const t = createTool();
    await t.execute({ file_path: "file.txt", content: "v1" }, {} as any);

    // File now exists, so a second write needs a fresh read
    const result = (await t.execute(
      { file_path: "file.txt", content: "v2" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("PROTOCOL_VIOLATION");
    expect(result.error.message).toContain("has not been read yet");
  });
});
