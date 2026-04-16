import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import sharp from "sharp";
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
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: expect.stringContaining("Unsupported image format"),
        },
      });
    });

    it("rejects paths outside the workspace", async () => {
      const t = createTool();
      const result = await t.execute({ path: "/etc/passwd.png" }, {} as any);
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "PATH_INVALID",
          message: "Path is outside the workspace.",
        },
      });
    });

    it("rejects path traversal attempts", async () => {
      const t = createTool();
      const result = await t.execute(
        { path: "../../etc/passwd.png" },
        {} as any,
      );
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "PATH_INVALID",
          message: "Path is outside the workspace.",
        },
      });
    });

    it("returns error when file does not exist", async () => {
      const t = createTool();
      const result = await t.execute({ path: "missing.png" }, {} as any);
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: expect.stringContaining("File not found"),
        },
      });
    });

    it("returns error for images exceeding 10 MB", async () => {
      const largePath = path.join(tmpDir, "large.png");
      const handle = await fs.open(largePath, "w");
      await handle.truncate(11 * 1024 * 1024);
      await handle.close();

      const t = createTool();
      const result = await t.execute({ path: "large.png" }, {} as any);
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: expect.stringContaining("Image too large"),
        },
      });
    });

    it("resolves relative paths against workspace", async () => {
      const imgPath = path.join(tmpDir, "photo.jpg");
      await fs.writeFile(imgPath, Buffer.from("fake-jpeg-data"));

      const t = createTool();
      const result = await t.execute({ path: "photo.jpg" }, {} as any);
      expect(result).toEqual({
        ok: true,
        data: {
          type: "image",
          path: imgPath,
          mediaType: "image/jpeg",
          sizeKB: 0,
        },
      });
    });

    it("resolves absolute paths within workspace", async () => {
      const imgPath = path.join(tmpDir, "abs.png");
      await fs.writeFile(imgPath, Buffer.alloc(2048));

      const t = createTool();
      const result = await t.execute({ path: imgPath }, {} as any);
      expect(result).toEqual({
        ok: true,
        data: {
          type: "image",
          path: imgPath,
          mediaType: "image/png",
          sizeKB: 2,
        },
      });
    });

    it("handles all supported image extensions", async () => {
      const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];
      const t = createTool();

      for (const ext of extensions) {
        const imgPath = path.join(tmpDir, `test${ext}`);
        await fs.writeFile(imgPath, Buffer.from("data"));
        const result = await t.execute({ path: `test${ext}` }, {} as any);
        expect(result).toMatchObject({
          ok: true,
          data: { type: "image" },
        });
      }
    });
  });

  describe("toModelOutput", () => {
    it("returns text content for error results", async () => {
      const t = createTool();
      const output = await t.toModelOutput?.({
        output: {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "something went wrong",
            hint: "try again",
          },
        },
      } as any);
      expect(output).toEqual({
        type: "content",
        value: [
          {
            type: "text",
            text: "[INVALID_INPUT] something went wrong — try again",
          },
        ],
      });
    });

    it("reads file and returns full-resolution WebP", async () => {
      const imgPath = path.join(tmpDir, "real.png");
      // Create a 2048x1024 PNG so sharp has a valid image to process
      const pngBuffer = await sharp({
        create: {
          width: 2048,
          height: 1024,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();
      await fs.writeFile(imgPath, pngBuffer);

      const t = createTool();
      const output = await t.toModelOutput?.({
        output: {
          ok: true,
          data: {
            type: "image",
            path: imgPath,
            mediaType: "image/png",
            sizeKB: Math.round(pngBuffer.length / 1024),
          },
        },
      } as any);

      expect(output).toHaveProperty("type", "content");
      const value = (output as any).value;
      expect(value).toHaveLength(2);
      expect(value[0].type).toBe("image-data");
      expect(value[0].mediaType).toBe("image/webp");

      // Verify the output is valid WebP at original resolution
      const decoded = await sharp(
        Buffer.from(value[0].data, "base64"),
      ).metadata();
      expect(decoded.format).toBe("webp");
      expect(decoded.width).toBe(2048);
      expect(decoded.height).toBe(1024);

      expect(value[1].type).toBe("text");
      expect(value[1].text).toContain("converted to WebP");
    });
  });
});
