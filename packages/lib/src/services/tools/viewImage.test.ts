import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { viewImageTool } from "./viewImage.js";

describe("viewImageTool", () => {
  let tmpDir: string;
  const originalEnv = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "viewimage-test-"));
    process.env.WORKSPACE_PATH = tmpDir;
  });

  afterEach(async () => {
    process.env.WORKSPACE_PATH = originalEnv;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function createTool() {
    const ctx = createMockContext();
    const t = viewImageTool(ctx);
    return t;
  }

  describe("execute", () => {
    it("rejects unsupported file extensions", async () => {
      const t = createTool();
      const result = await t.execute({ path: "file.txt" }, {} as any);
      expect(result).toEqual({
        type: "error",
        message: expect.stringContaining("Unsupported image format"),
      });
    });

    it("rejects paths outside the workspace", async () => {
      const t = createTool();
      const result = await t.execute({ path: "/etc/passwd.png" }, {} as any);
      expect(result).toEqual({
        type: "error",
        message: "Path is outside the workspace.",
      });
    });

    it("rejects path traversal attempts", async () => {
      const t = createTool();
      const result = await t.execute(
        { path: "../../etc/passwd.png" },
        {} as any,
      );
      expect(result).toEqual({
        type: "error",
        message: "Path is outside the workspace.",
      });
    });

    it("returns error when file does not exist", async () => {
      const t = createTool();
      const result = await t.execute({ path: "missing.png" }, {} as any);
      expect(result).toEqual({
        type: "error",
        message: expect.stringContaining("File not found"),
      });
    });

    it("returns error for images exceeding 10 MB", async () => {
      const largePath = path.join(tmpDir, "large.png");
      const handle = await fs.open(largePath, "w");
      await handle.truncate(11 * 1024 * 1024);
      await handle.close();

      const t = createTool();
      const result = await t.execute({ path: "large.png" }, {} as any);
      expect(result).toEqual({
        type: "error",
        message: expect.stringContaining("Image too large"),
      });
    });

    it("resolves relative paths against workspace", async () => {
      const imgPath = path.join(tmpDir, "photo.jpg");
      await fs.writeFile(imgPath, Buffer.from("fake-jpeg-data"));

      const t = createTool();
      const result = await t.execute({ path: "photo.jpg" }, {} as any);
      expect(result).toEqual({
        type: "image",
        path: imgPath,
        mediaType: "image/jpeg",
        sizeKB: 0,
      });
    });

    it("resolves absolute paths within workspace", async () => {
      const imgPath = path.join(tmpDir, "abs.png");
      await fs.writeFile(imgPath, Buffer.alloc(2048));

      const t = createTool();
      const result = await t.execute({ path: imgPath }, {} as any);
      expect(result).toEqual({
        type: "image",
        path: imgPath,
        mediaType: "image/png",
        sizeKB: 2,
      });
    });

    it("handles all supported image extensions", async () => {
      const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];
      const t = createTool();

      for (const ext of extensions) {
        const imgPath = path.join(tmpDir, `test${ext}`);
        await fs.writeFile(imgPath, Buffer.from("data"));
        const result = await t.execute({ path: `test${ext}` }, {} as any);
        expect(result).toHaveProperty("type", "image");
      }
    });
  });

  describe("toModelOutput", () => {
    it("returns text content for error results", async () => {
      const t = createTool();
      const output = await t.toModelOutput?.({
        output: { type: "error", message: "something went wrong" },
      } as any);
      expect(output).toEqual({
        type: "content",
        value: [{ type: "text", text: "something went wrong" }],
      });
    });

    it("reads file and returns base64 image-data for success results", async () => {
      const imgPath = path.join(tmpDir, "real.png");
      const imgData = Buffer.from("fake-png-bytes");
      await fs.writeFile(imgPath, imgData);

      const t = createTool();
      const output = await t.toModelOutput?.({
        output: {
          type: "image",
          path: imgPath,
          mediaType: "image/png",
          sizeKB: 1,
        },
      } as any);

      expect(output).toEqual({
        type: "content",
        value: [
          {
            type: "image-data",
            data: imgData.toString("base64"),
            mediaType: "image/png",
          },
          { type: "text", text: "Image loaded (1 KB)." },
        ],
      });
    });
  });
});
