import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateTracker } from "./fileState.js";
import { readFileTool } from "./readFileTool.js";

describe("readFileTool", () => {
  let tmpDir: string;
  let tracker: FileStateTracker;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "readfile-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
    tracker = new FileStateTracker();
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  function createTool() {
    return readFileTool(tracker);
  }

  async function writeFile(name: string, content: string) {
    const p = path.join(tmpDir, name);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, content, "utf-8");
    return p;
  }

  it("reads a file and returns numbered lines", async () => {
    await writeFile("hello.txt", "line1\nline2\nline3");
    const t = createTool();
    const result = await t.execute({ file_path: "hello.txt" }, {} as any);
    expect(result).toMatchObject({
      file_path: "hello.txt",
      totalLines: 3,
    });
    expect((result as any).content).toContain("1\tline1");
    expect((result as any).content).toContain("2\tline2");
    expect((result as any).content).toContain("3\tline3");
  });

  it("returns error for missing file", async () => {
    const t = createTool();
    const result = await t.execute({ file_path: "nope.txt" }, {} as any);
    expect(result).toMatchObject({ error: "File not found: nope.txt" });
  });

  it("supports offset and limit for partial reads", async () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line${i}`).join("\n");
    await writeFile("big.txt", lines);
    const t = createTool();
    const result = await t.execute(
      { file_path: "big.txt", offset: 2, limit: 3 },
      {} as any,
    );
    expect((result as any).content).toContain("3\tline2");
    expect((result as any).content).toContain("5\tline4");
    expect((result as any).linesShown).toBe("3-5");
  });

  it("reads code files, not just markdown", async () => {
    await writeFile("src/app.ts", "const x = 1;\nconsole.log(x);");
    const t = createTool();
    const result = await t.execute({ file_path: "src/app.ts" }, {} as any);
    expect((result as any).content).toContain("const x = 1;");
  });

  it("reads files in nested directories", async () => {
    await writeFile("a/b/c/deep.json", '{"key": "value"}');
    const t = createTool();
    const result = await t.execute({ file_path: "a/b/c/deep.json" }, {} as any);
    expect((result as any).content).toContain('"key": "value"');
  });

  it("rejects paths outside workspace", async () => {
    const t = createTool();
    await expect(
      t.execute({ file_path: "../../../etc/passwd" }, {} as any),
    ).rejects.toThrow("Path traversal not allowed");
  });
});
