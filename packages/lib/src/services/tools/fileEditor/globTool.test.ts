import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { globTool } from "./globTool.js";

describe("globTool", () => {
  let tmpDir: string;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "glob-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeFile(name: string, content = "") {
    const p = path.join(tmpDir, name);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, content, "utf-8");
  }

  it("finds files matching a glob pattern", async () => {
    await writeFile("src/index.ts", "");
    await writeFile("src/utils.ts", "");
    await writeFile("src/readme.md", "");

    const t = globTool();
    const result = (await t.execute({ pattern: "**/*.ts" }, {} as any)) as any;

    expect(result.ok).toBe(true);
    expect(result.data.numFiles).toBe(2);
    expect(result.data.files).toContain(path.join(tmpDir, "src/index.ts"));
    expect(result.data.files).toContain(path.join(tmpDir, "src/utils.ts"));
    expect(result.data.files).not.toContain(path.join(tmpDir, "src/readme.md"));
  });

  it("scopes search to a subdirectory", async () => {
    await writeFile("src/app.ts", "");
    await writeFile("lib/helper.ts", "");

    const t = globTool();
    const result = (await t.execute(
      { pattern: "*.ts", path: "src" },
      {} as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.data.numFiles).toBe(1);
    expect(result.data.files).toContain(path.join(tmpDir, "src/app.ts"));
  });

  it("returns empty result for no matches", async () => {
    await writeFile("readme.md", "");

    const t = globTool();
    const result = (await t.execute({ pattern: "**/*.py" }, {} as any)) as any;

    expect(result.ok).toBe(true);
    expect(result.data.numFiles).toBe(0);
    expect(result.data.files).toEqual([]);
  });

  it("rejects path traversal in search path", async () => {
    const t = globTool();
    const result = (await t.execute(
      { pattern: "*", path: "../../" },
      {} as any,
    )) as any;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("PATH_INVALID");
    expect(result.error.message).toContain("Path traversal not allowed");
  });

  it("handles brace patterns", async () => {
    await writeFile("a.json", "");
    await writeFile("b.yaml", "");
    await writeFile("c.txt", "");

    const t = globTool();
    const result = (await t.execute(
      { pattern: "*.{json,yaml}" },
      {} as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.data.numFiles).toBe(2);
    expect(result.data.files).toContain(path.join(tmpDir, "a.json"));
    expect(result.data.files).toContain(path.join(tmpDir, "b.yaml"));
  });
});
