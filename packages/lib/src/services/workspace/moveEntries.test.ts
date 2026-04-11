import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { moveEntries } from "./moveEntries.js";

const TEST_WORKSPACE = path.join(
  process.env.TMPDIR ?? "/tmp",
  "move-entries-test",
);

describe("moveEntries", () => {
  const original = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    process.env.WORKSPACE_PATH = TEST_WORKSPACE;
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });
  });

  afterEach(async () => {
    if (original !== undefined) {
      process.env.WORKSPACE_PATH = original;
    } else {
      delete process.env.WORKSPACE_PATH;
    }
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
  });

  it("moves a file to a subdirectory", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "file.txt"), "hello");
    await fs.mkdir(path.join(TEST_WORKSPACE, "dest"));

    const result = await moveEntries(["file.txt"], "dest");
    expect(result.moved).toEqual(["file.txt"]);
    expect(result.failed).toEqual([]);

    // File should be at new location
    const content = await fs.readFile(
      path.join(TEST_WORKSPACE, "dest", "file.txt"),
      "utf-8",
    );
    expect(content).toBe("hello");

    // File should not be at old location
    await expect(
      fs.access(path.join(TEST_WORKSPACE, "file.txt")),
    ).rejects.toThrow();
  });

  it("moves multiple files", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "a.txt"), "a");
    await fs.writeFile(path.join(TEST_WORKSPACE, "b.txt"), "b");
    await fs.mkdir(path.join(TEST_WORKSPACE, "target"));

    const result = await moveEntries(["a.txt", "b.txt"], "target");
    expect(result.moved).toEqual(["a.txt", "b.txt"]);
    expect(result.failed).toEqual([]);
  });

  it("moves a directory", async () => {
    await fs.mkdir(path.join(TEST_WORKSPACE, "src"));
    await fs.writeFile(path.join(TEST_WORKSPACE, "src", "index.ts"), "code");
    await fs.mkdir(path.join(TEST_WORKSPACE, "dest"));

    const result = await moveEntries(["src"], "dest");
    expect(result.moved).toEqual(["src"]);

    const content = await fs.readFile(
      path.join(TEST_WORKSPACE, "dest", "src", "index.ts"),
      "utf-8",
    );
    expect(content).toBe("code");
  });

  it("fails when name collision exists at destination", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "file.txt"), "source");
    await fs.mkdir(path.join(TEST_WORKSPACE, "dest"));
    await fs.writeFile(
      path.join(TEST_WORKSPACE, "dest", "file.txt"),
      "existing",
    );

    const result = await moveEntries(["file.txt"], "dest");
    expect(result.moved).toEqual([]);
    expect(result.failed).toEqual(["file.txt"]);

    // Original file should still exist
    const content = await fs.readFile(
      path.join(TEST_WORKSPACE, "file.txt"),
      "utf-8",
    );
    expect(content).toBe("source");
  });

  it("throws on path traversal in destination", async () => {
    await expect(moveEntries(["file.txt"], "../outside")).rejects.toThrow(
      "Path traversal not allowed",
    );
  });

  it("throws when destination is not a directory", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "file.txt"), "hello");
    await fs.writeFile(path.join(TEST_WORKSPACE, "notadir"), "oops");

    await expect(moveEntries(["file.txt"], "notadir")).rejects.toThrow(
      "Destination is not a directory",
    );
  });

  it("blocks path traversal in source paths", async () => {
    await fs.mkdir(path.join(TEST_WORKSPACE, "dest"));

    const result = await moveEntries(["../escape"], "dest");
    expect(result.moved).toEqual([]);
    expect(result.failed).toEqual(["../escape"]);
  });

  it("allows moving to workspace root (empty destination)", async () => {
    await fs.mkdir(path.join(TEST_WORKSPACE, "subdir"));
    await fs.writeFile(
      path.join(TEST_WORKSPACE, "subdir", "file.txt"),
      "hello",
    );

    const result = await moveEntries(["subdir/file.txt"], "");
    expect(result.moved).toEqual(["subdir/file.txt"]);

    const content = await fs.readFile(
      path.join(TEST_WORKSPACE, "file.txt"),
      "utf-8",
    );
    expect(content).toBe("hello");
  });

  it("handles mixed valid and invalid source paths", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "valid.txt"), "ok");
    await fs.mkdir(path.join(TEST_WORKSPACE, "dest"));

    const result = await moveEntries(
      ["valid.txt", "../escape", "missing.txt"],
      "dest",
    );
    expect(result.moved).toEqual(["valid.txt"]);
    expect(result.failed).toEqual(["../escape", "missing.txt"]);
  });
});
