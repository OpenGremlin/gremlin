import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { countOccurrences, editFileTool } from "./editFileTool.js";
import { FileStateTracker } from "./fileState.js";

describe("editFileTool", () => {
  let tmpDir: string;
  let tracker: FileStateTracker;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "editfile-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
    tracker = new FileStateTracker();
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  function createTool() {
    const ctx = createMockContext();
    return editFileTool(ctx, tracker);
  }

  async function writeAndRead(name: string, content: string): Promise<string> {
    const p = path.join(tmpDir, name);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, content, "utf-8");
    tracker.recordRead(p, content, false);
    return p;
  }

  describe("basic replacement", () => {
    it("replaces a unique string", async () => {
      await writeAndRead("file.ts", "const x = 1;\nconst y = 2;\n");
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "file.ts",
          old_string: "const x = 1;",
          new_string: "const x = 42;",
          replace_all: false,
        },
        {} as any,
      );
      expect(result).toMatchObject({ file_path: "file.ts", replacements: 1 });
      const content = await fsp.readFile(path.join(tmpDir, "file.ts"), "utf-8");
      expect(content).toBe("const x = 42;\nconst y = 2;\n");
    });

    it("replaces all occurrences with replace_all", async () => {
      await writeAndRead("file.txt", "foo bar foo baz foo");
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "file.txt",
          old_string: "foo",
          new_string: "qux",
          replace_all: true,
        },
        {} as any,
      );
      expect(result).toMatchObject({ replacements: 3 });
      const content = await fsp.readFile(
        path.join(tmpDir, "file.txt"),
        "utf-8",
      );
      expect(content).toBe("qux bar qux baz qux");
    });
  });

  describe("validation", () => {
    it("rejects when old_string equals new_string", async () => {
      await writeAndRead("file.txt", "hello");
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "file.txt",
          old_string: "hello",
          new_string: "hello",
          replace_all: false,
        },
        {} as any,
      );
      expect(result).toMatchObject({
        error: expect.stringContaining("identical"),
      });
    });

    it("rejects when old_string is not found", async () => {
      await writeAndRead("file.txt", "hello world");
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "file.txt",
          old_string: "goodbye",
          new_string: "hi",
          replace_all: false,
        },
        {} as any,
      );
      expect(result).toMatchObject({
        error: expect.stringContaining("not found"),
      });
    });

    it("rejects ambiguous match without replace_all", async () => {
      await writeAndRead("file.txt", "aaa bbb aaa");
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "file.txt",
          old_string: "aaa",
          new_string: "ccc",
          replace_all: false,
        },
        {} as any,
      );
      expect(result).toMatchObject({
        error: expect.stringContaining("appears 2 times"),
      });
    });

    it("rejects editing without prior read", async () => {
      const p = path.join(tmpDir, "file.txt");
      await fsp.writeFile(p, "content");
      const t = createTool();
      await expect(
        t.execute(
          {
            file_path: "file.txt",
            old_string: "content",
            new_string: "new",
            replace_all: false,
          },
          {} as any,
        ),
      ).rejects.toThrow("has not been read yet");
    });

    it("returns error for missing file", async () => {
      const t = createTool();
      const result = await t.execute(
        {
          file_path: "missing.txt",
          old_string: "x",
          new_string: "y",
          replace_all: false,
        },
        {} as any,
      );
      expect(result).toMatchObject({
        error: expect.stringContaining("File not found"),
      });
    });

    it("rejects path traversal", async () => {
      const t = createTool();
      await expect(
        t.execute(
          {
            file_path: "../escape.txt",
            old_string: "x",
            new_string: "y",
            replace_all: false,
          },
          {} as any,
        ),
      ).rejects.toThrow("Path traversal not allowed");
    });
  });

  describe("clears state after edit", () => {
    it("requires re-read before second edit", async () => {
      await writeAndRead("file.txt", "aaa bbb");
      const t = createTool();
      await t.execute(
        {
          file_path: "file.txt",
          old_string: "aaa",
          new_string: "ccc",
          replace_all: false,
        },
        {} as any,
      );

      // Second edit without re-read should fail
      await expect(
        t.execute(
          {
            file_path: "file.txt",
            old_string: "bbb",
            new_string: "ddd",
            replace_all: false,
          },
          {} as any,
        ),
      ).rejects.toThrow("has not been read yet");
    });
  });
});

describe("countOccurrences", () => {
  it("counts non-overlapping matches", () => {
    expect(countOccurrences("abcabcabc", "abc")).toBe(3);
  });

  it("returns 0 for no match", () => {
    expect(countOccurrences("hello", "xyz")).toBe(0);
  });

  it("returns 0 for empty search", () => {
    expect(countOccurrences("hello", "")).toBe(0);
  });

  it("handles overlapping patterns correctly (non-overlapping count)", () => {
    expect(countOccurrences("aaa", "aa")).toBe(1);
  });
});
