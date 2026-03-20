import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "../sandbox/types.js";

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

type ViewImageResult =
  | { type: "image"; data: string; mediaType: string; sizeKB: number }
  | { type: "error"; message: string };

export function viewImageTool(
  ctx: ServiceContext,
  getSession: () => SandboxSession | undefined,
) {
  return tool({
    description:
      "View an image file from the sandbox workspace. Returns the image so you can see its visual contents. Supports PNG, JPEG, GIF, WebP, and BMP. The file must already exist in the sandbox.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Path to the image file (absolute, or relative to /workspace)",
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

      const session = getSession();
      if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
        return {
          type: "error",
          message: "Sandbox is not online. Call ensureSandbox first.",
        };
      }

      const resolved = filePath.startsWith("/")
        ? filePath
        : `/workspace/${filePath}`;

      // Check file exists and size
      const sizeResult = await ctx.services.sandbox.execCommand(
        session,
        `stat -c %s ${JSON.stringify(resolved)} 2>/dev/null || echo "NOT_FOUND"`,
      );

      const sizeStr = sizeResult.output.trim();
      if (sizeStr === "NOT_FOUND" || sizeResult.exitCode !== 0) {
        return { type: "error", message: `File not found: ${resolved}` };
      }

      const fileSize = Number.parseInt(sizeStr, 10);
      if (fileSize > MAX_IMAGE_SIZE) {
        return {
          type: "error",
          message: `Image too large (${(fileSize / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_IMAGE_SIZE / 1024 / 1024} MB.`,
        };
      }

      // Read as base64
      const result = await ctx.services.sandbox.execCommand(
        session,
        `base64 -w 0 ${JSON.stringify(resolved)}`,
      );

      if (result.exitCode !== 0) {
        return {
          type: "error",
          message: `Failed to read image: ${result.stderr || result.output}`,
        };
      }

      return {
        type: "image",
        data: result.output.trim(),
        mediaType: MIME_TYPES[ext] ?? "image/png",
        sizeKB: Math.round(fileSize / 1024),
      };
    },
    toModelOutput({ output }) {
      if (output.type === "error") {
        return {
          type: "content",
          value: [{ type: "text", text: output.message }],
        };
      }
      return {
        type: "content",
        value: [
          { type: "media", data: output.data, mediaType: output.mediaType },
          { type: "text", text: `Image loaded (${output.sizeKB} KB).` },
        ],
      };
    },
  });
}
