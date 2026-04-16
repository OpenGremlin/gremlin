import * as fs from "node:fs/promises";
import { tool } from "ai";
import sharp from "sharp";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { resolveAndValidate } from "./fileEditor/pathUtils.js";
import {
  type GremlinToolResult,
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "./toolResult.js";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
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

type ViewImageSuccess = {
  type: "image";
  path: string;
  mediaType: string;
  sizeKB: number;
  resizeTo?: number;
};

export function viewImageTool(_ctx: ServiceContext) {
  return tool({
    description:
      "View an image file from the workspace. Returns the image so you can see its visual contents. Use full workspace paths (e.g. /workspace/uploads/2026-01-01/photo.png). Supports PNG, JPEG, GIF, WebP, BMP, TIFF, AVIF, SVG, and ICO.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Path to the image file, e.g. /workspace/uploads/2026-01-01/photo.png",
        ),
      resizeTo: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Optional. Constrain the longest side to this many pixels (preserving aspect ratio). Images smaller than this are not upscaled. Use this if the full-resolution image is too large for the model context.",
        ),
    }),
    execute: wrapExecute<{ path: string; resizeTo?: number }, ViewImageSuccess>(
      "viewImage",
      async ({ path: filePath, resizeTo }) => {
        const ext = getExtension(filePath);
        if (!IMAGE_EXTENSIONS.has(ext)) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            `Unsupported image format "${ext}"`,
            "Supported extensions: PNG, JPEG, GIF, WebP, BMP, TIFF, AVIF, SVG, ICO.",
          );
        }

        let resolved: string;
        try {
          resolved = resolveAndValidate(filePath);
        } catch {
          return toolErr(
            ToolErrorCode.PathInvalid,
            "Path is outside the workspace.",
            "Pass a path inside the workspace (relative, or an absolute path under the workspace root).",
          );
        }

        let stat: Awaited<ReturnType<typeof fs.stat>>;
        try {
          stat = await fs.stat(resolved);
        } catch {
          return toolErr(
            ToolErrorCode.FileNotFound,
            `File not found: ${resolved}`,
            "Use `listFiles` or `glob` to find the correct path before viewing.",
          );
        }

        if (stat.size > MAX_IMAGE_SIZE) {
          return toolErr(
            ToolErrorCode.FileTooLarge,
            `Image too large (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_IMAGE_SIZE / 1024 / 1024} MB.`,
            "Resize or compress the image before viewing, or use a smaller source file.",
          );
        }

        return toolOk({
          type: "image" as const,
          path: resolved,
          mediaType: MIME_TYPES[ext] ?? "image/png",
          sizeKB: Math.round(stat.size / 1024),
          resizeTo,
        });
      },
    ),
    async toModelOutput({
      output,
    }: {
      output: GremlinToolResult<ViewImageSuccess>;
    }) {
      if (!output.ok) {
        const { code, message, hint } = output.error;
        return {
          type: "content" as const,
          value: [
            {
              type: "text" as const,
              text: `[${code}] ${message}${hint ? ` — ${hint}` : ""}`,
            },
          ],
        };
      }
      const raw = await fs.readFile(output.data.path);
      let pipeline = sharp(raw);
      if (output.data.resizeTo) {
        pipeline = pipeline.resize(output.data.resizeTo, output.data.resizeTo, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      const data = await pipeline.webp({ quality: 90 }).toBuffer();
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
