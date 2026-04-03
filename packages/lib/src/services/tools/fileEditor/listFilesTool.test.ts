import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listFilesTool } from "./listFilesTool.js";

describe("listFilesTool", () => {
  let tmpDir: string;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "listfiles-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it("lists files and directories at workspace root", async () => {
    await fsp.writeFile(path.join(tmpDir, "a.txt"), "");
    await fsp.writeFile(path.join(tmpDir, "b.ts"), "");
    await fsp.mkdir(path.join(tmpDir, "src"));

    const t = listFilesTool();
    const result = await t.execute({ path: "" }, {} as any);
    expect((result as any).entries).toContain("a.txt");
    expect((result as any).entries).toContain("b.ts");
    expect((result as any).entries).toContain("src/");
  });

  it("lists files in a subdirectory", async () => {
    await fsp.mkdir(path.join(tmpDir, "src"));
    await fsp.writeFile(path.join(tmpDir, "src/index.ts"), "");
    await fsp.writeFile(path.join(tmpDir, "src/utils.ts"), "");

    const t = listFilesTool();
    const result = await t.execute({ path: "src" }, {} as any);
    expect((result as any).entries).toEqual(["index.ts", "utils.ts"]);
  });

  it("returns error for non-existent directory", async () => {
    const t = listFilesTool();
    const result = await t.execute({ path: "nope" }, {} as any);
    expect(result).toMatchObject({
      error: expect.stringContaining("not found"),
    });
  });

  it("rejects path traversal", async () => {
    const t = listFilesTool();
    await expect(t.execute({ path: "../../" }, {} as any)).rejects.toThrow(
      "Path traversal not allowed",
    );
  });
});
