import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { grepTool } from "./grepTool.js";

describe("grepTool", () => {
  let tmpDir: string;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "grep-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeFile(name: string, content: string) {
    const p = path.join(tmpDir, name);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, content, "utf-8");
  }

  describe("files_with_matches mode", () => {
    it("returns files containing the pattern", async () => {
      await writeFile("a.ts", "const foo = 1;");
      await writeFile("b.ts", "const bar = 2;");
      await writeFile("c.ts", "const foo = 3;");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "foo", output_mode: "files_with_matches" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(2);
      expect(result.data.files).toContain(path.join(tmpDir, "a.ts"));
      expect(result.data.files).toContain(path.join(tmpDir, "c.ts"));
      expect(result.data.files).not.toContain(path.join(tmpDir, "b.ts"));
    });

    it("returns empty for no matches", async () => {
      await writeFile("a.ts", "hello world");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "zzz", output_mode: "files_with_matches" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(0);
      expect(result.data.files).toEqual([]);
    });
  });

  describe("content mode", () => {
    it("returns matching lines with file paths and line numbers", async () => {
      await writeFile("src/app.ts", "line1\nconst x = 42;\nline3");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "const x", output_mode: "content" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(1);
      expect(result.data.content).toContain(
        `${path.join(tmpDir, "src/app.ts")}:2:const x = 42;`,
      );
    });

    it("supports context lines", async () => {
      await writeFile("file.ts", "line1\nline2\nMATCH\nline4\nline5");

      const t = grepTool();
      const result = (await t.execute(
        {
          pattern: "MATCH",
          output_mode: "content",
          context_lines: 1,
        },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.content).toContain(
        `${path.join(tmpDir, "file.ts")}:2:line2`,
      );
      expect(result.data.content).toContain(
        `${path.join(tmpDir, "file.ts")}:3:MATCH`,
      );
      expect(result.data.content).toContain(
        `${path.join(tmpDir, "file.ts")}:4:line4`,
      );
    });

    it("supports case insensitive search", async () => {
      await writeFile("file.ts", "Hello World");

      const t = grepTool();
      const result = (await t.execute(
        {
          pattern: "hello",
          output_mode: "content",
          case_insensitive: true,
        },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.content).toContain("Hello World");
    });
  });

  describe("count mode", () => {
    it("returns match counts per file", async () => {
      await writeFile("a.ts", "foo\nbar\nfoo");
      await writeFile("b.ts", "foo");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "foo", output_mode: "count" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(2);
      expect(result.data.numMatches).toBe(3);
      expect(result.data.counts).toContain(`${path.join(tmpDir, "a.ts")}:2`);
      expect(result.data.counts).toContain(`${path.join(tmpDir, "b.ts")}:1`);
    });
  });

  describe("filtering", () => {
    it("filters by glob pattern", async () => {
      await writeFile("a.ts", "target");
      await writeFile("b.js", "target");
      await writeFile("c.md", "target");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "target", glob: "*.ts", output_mode: "files_with_matches" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(1);
      expect(result.data.files).toContain(path.join(tmpDir, "a.ts"));
    });

    it("scopes to a subdirectory", async () => {
      await writeFile("src/a.ts", "target");
      await writeFile("lib/b.ts", "target");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "target", path: "src", output_mode: "files_with_matches" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numFiles).toBe(1);
      expect(result.data.files).toContain(path.join(tmpDir, "src/a.ts"));
    });

    it("searches a single file", async () => {
      await writeFile("file.ts", "hello\nworld");

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "world", path: "file.ts", output_mode: "content" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.content).toContain(
        `${path.join(tmpDir, "file.ts")}:2:world`,
      );
    });
  });

  describe("validation", () => {
    it("returns error for invalid regex", async () => {
      const t = grepTool();
      const result = (await t.execute(
        { pattern: "[invalid", output_mode: "files_with_matches" },
        {} as any,
      )) as any;

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
      expect(result.error.message).toContain("Invalid regex");
    });

    it("returns error for missing path", async () => {
      const t = grepTool();
      const result = (await t.execute(
        {
          pattern: "x",
          path: "nonexistent",
          output_mode: "files_with_matches",
        },
        {} as any,
      )) as any;

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("FILE_NOT_FOUND");
      expect(result.error.message).toContain("Path not found");
    });

    it("rejects path traversal", async () => {
      const t = grepTool();
      const result = (await t.execute(
        { pattern: "x", path: "../../", output_mode: "files_with_matches" },
        {} as any,
      )) as any;
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("PATH_INVALID");
      expect(result.error.message).toContain("Path traversal not allowed");
    });
  });

  describe("head_limit", () => {
    it("limits content output", async () => {
      const lines = Array.from({ length: 20 }, (_, i) => `match${i}`).join(
        "\n",
      );
      await writeFile("big.ts", lines);

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "match", output_mode: "content", head_limit: 5 },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numLines).toBe(5);
      expect(result.data.truncated).toBe(true);
    });

    it("head_limit 0 means unlimited", async () => {
      const lines = Array.from({ length: 300 }, (_, i) => `match${i}`).join(
        "\n",
      );
      await writeFile("big.ts", lines);

      const t = grepTool();
      const result = (await t.execute(
        { pattern: "match", output_mode: "content", head_limit: 0 },
        {} as any,
      )) as any;

      expect(result.ok).toBe(true);
      expect(result.data.numLines).toBe(300);
      expect(result.data.truncated).toBeUndefined();
    });
  });

  it("supports regex patterns", async () => {
    await writeFile("file.ts", "const x = 42;\nlet y = 'hello';");

    const t = grepTool();
    const result = (await t.execute(
      { pattern: "(const|let)\\s+\\w+", output_mode: "content" },
      {} as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.data.numLines).toBe(2);
  });
});
