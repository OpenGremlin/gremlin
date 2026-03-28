import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import sharp from "sharp";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

const MAX_DIMENSION = 1024;

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".heic",
  ".heif",
  ".tiff",
  ".tif",
  ".avif",
  ".svg",
  ".ico",
]);

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot).toLowerCase() : "";
}

function getWorkspacePath(): string {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

type ViewImageResult =
  | { type: "image"; path: string; mediaType: string; sizeKB: number }
  | { type: "error"; message: string };

export function viewImageTool(_ctx: ServiceContext) {
  return tool({
    description:
      "View an image file from the workspace. Returns the image so you can see its visual contents. Use full workspace paths (e.g. /workspace/uploads/2026-01-01/photo.png). Supports PNG, JPEG, GIF, WebP, BMP, HEIC, TIFF, AVIF, SVG, and ICO.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Path to the image file, e.g. /workspace/uploads/2026-01-01/photo.png",
        ),
    }),
    execute: async ({ path: filePath }): Promise<ViewImageResult> => {
      const ext = getExtension(filePath);
      if (!IMAGE_EXTENSIONS.has(ext)) {
        return {
          type: "error",
          message: `Unsupported image format "${ext}". Supported: ${[...IMAGE_EXTENSIONS].join(", ")}`,
        };
      }

      const workspacePath = getWorkspacePath();
      const resolved = filePath.startsWith("/")
        ? filePath
        : path.join(workspacePath, filePath);

      if (!resolved.startsWith(workspacePath)) {
        return { type: "error", message: "Path is outside the workspace." };
      }

      let stat: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stat = await fs.stat(resolved);
      } catch {
        return { type: "error", message: `File not found: ${resolved}` };
      }

      if (stat.size > MAX_IMAGE_SIZE) {
        return {
          type: "error",
          message: `Image too large (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_IMAGE_SIZE / 1024 / 1024} MB.`,
        };
      }

      return {
        type: "image",
        path: resolved,
        mediaType: MIME_TYPES[ext] ?? "image/png",
        sizeKB: Math.round(stat.size / 1024),
      };
    },
    async toModelOutput({ output }) {
      if (output.type === "error") {
        return {
          type: "content",
          value: [{ type: "text" as const, text: output.message }],
        };
      }
      const raw = await fs.readFile(output.path);

      // HEIC/HEIF can't be decoded by sharp (no libheif in prebuilt binaries).
      // Send as-is and let the model handle the raw bytes.
      const isHeic =
        output.mediaType === "image/heic" || output.mediaType === "image/heif";

      if (isHeic) {
        return {
          type: "content" as const,
          value: [
            {
              type: "image-data" as const,
              data: raw.toString("base64"),
              mediaType: output.mediaType,
            },
            {
              type: "text" as const,
              text: `Image viewed (${Math.round(raw.length / 1024)} KB, HEIC format). Note: image content is not retained in conversation history — call viewImage again if you need to re-examine it.`,
            },
          ],
        };
      }

      const data = await sharp(raw)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" })
        .webp({ quality: 90 })
        .toBuffer();
      return {
        type: "content" as const,
        value: [
          {
            type: "image-data" as const,
            data: data.toString("base64"),
            mediaType: "image/webp",
          },
          {
            type: "text" as const,
            text: `Image viewed (${Math.round(data.length / 1024)} KB, converted to WebP). Note: image content is not retained in conversation history — call viewImage again if you need to re-examine it.`,
          },
        ],
      };
    },
  });
}
