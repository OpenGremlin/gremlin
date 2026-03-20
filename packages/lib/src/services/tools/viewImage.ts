import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
]);

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
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
      "View an image file from the workspace. Returns the image so you can see its visual contents. Supports PNG, JPEG, GIF, WebP, and BMP.",
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
      const data = await fs.readFile(output.path);
      return {
        type: "content" as const,
        value: [
          {
            type: "image-data" as const,
            data: data.toString("base64"),
            mediaType: output.mediaType,
          },
          {
            type: "text" as const,
            text: `Image loaded (${output.sizeKB} KB).`,
          },
        ],
      };
    },
  });
}
