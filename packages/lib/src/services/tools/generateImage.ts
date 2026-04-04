import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ImageModel } from "ai";
import { generateImage, tool } from "ai";
import sharp from "sharp";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import {
  getWorkspacePath,
  resolveAndValidate,
} from "./fileEditor/pathUtils.js";

const MAX_SOURCE_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Tool that generates images using the agent's configured image model.
 * Saves the generated image to the workspace, auto-attaches it to the
 * task so the user can see it, and returns the file path.
 *
 * Supports text-to-image and image-to-image (editing, variations, style
 * transfer) by accepting an optional source image from the workspace.
 */
export function generateImageTool(
  ctx: ServiceContext,
  imageModel: ImageModel,
  taskId: string | null,
) {
  return tool({
    description:
      "Generate an image from a text prompt. The image is saved to the workspace " +
      "and automatically attached to the task so the user can see it. " +
      "Use descriptive, detailed prompts for best results.\n\n" +
      "For image editing, variations, or style transfer, pass a sourceImage path " +
      "to use an existing workspace image as the starting point.",
    inputSchema: z.object({
      prompt: z
        .string()
        .describe("Detailed text description of the image to generate"),
      sourceImage: z
        .string()
        .optional()
        .describe(
          "Path to a source image in the workspace for image-to-image generation " +
            "(editing, variations, style transfer). Omit for text-to-image.",
        ),
      size: z
        .string()
        .optional()
        .describe(
          'Image dimensions, e.g. "1024x1024", "1792x1024". Defaults to model default.',
        ),
      aspectRatio: z
        .string()
        .optional()
        .describe(
          'Aspect ratio, e.g. "16:9", "1:1". Alternative to size. Defaults to model default.',
        ),
      outputPath: z
        .string()
        .optional()
        .describe(
          'Workspace path to save the image to (e.g. "assets/hero.png"). ' +
            "Parent directories are created automatically. Defaults to generated-images/.",
        ),
    }),
    execute: async ({ prompt, sourceImage, size, aspectRatio, outputPath }) => {
      // Build the prompt — either a string or an object with source images
      let imagePrompt: Parameters<typeof generateImage>[0]["prompt"];
      if (sourceImage) {
        const sourceData = await readSourceImage(sourceImage);
        if ("error" in sourceData) return sourceData;
        imagePrompt = { text: prompt, images: [sourceData.base64] };
      } else {
        imagePrompt = prompt;
      }

      const result = await generateImage({
        model: imageModel,
        prompt: imagePrompt,
        ...(size ? { size: size as `${number}x${number}` } : {}),
        ...(aspectRatio
          ? { aspectRatio: aspectRatio as `${number}:${number}` }
          : {}),
      });

      const image = result.images[0];
      if (!image) {
        return { error: "No image was generated" };
      }

      // Save to workspace
      const workspace = getWorkspacePath();
      let filePath: string;
      if (outputPath) {
        filePath = resolveAndValidate(outputPath);
      } else {
        const imagesDir = path.join(workspace, "generated-images");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        filePath = path.join(imagesDir, `image-${timestamp}.png`);
      }
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const relativePath = path.relative(workspace, filePath);

      await fs.writeFile(filePath, image.uint8Array);

      // Auto-attach to task so the user sees it in the UI
      if (taskId) {
        await ctx.services.tasks
          .addTaskAttachment(ctx, taskId, {
            type: "file",
            path: relativePath,
          })
          .catch(() => {});
      }

      return {
        path: relativePath,
        prompt,
        ...(sourceImage ? { sourceImage } : {}),
      };
    },
  });
}

/**
 * Read a workspace image and convert to PNG base64 using sharp.
 * Same image processing pipeline as viewImageTool.
 */
async function readSourceImage(
  filePath: string,
): Promise<{ base64: string } | { error: string }> {
  const resolved = resolveAndValidate(filePath);

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(resolved);
  } catch {
    return { error: `Source image not found: ${filePath}` };
  }

  if (stat.size > MAX_SOURCE_IMAGE_SIZE) {
    return {
      error: `Source image too large (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_SOURCE_IMAGE_SIZE / 1024 / 1024} MB.`,
    };
  }

  const raw = await fs.readFile(resolved);
  const png = await sharp(raw).png().toBuffer();
  return { base64: png.toString("base64") };
}
