import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { resolveAndValidate } from "./fileEditor/pathUtils.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "./toolResult.js";

export function attachFileTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Attach a file from the workspace as a task artifact. Use this whenever you create or download a file that the user might find useful — screenshots, images, CSVs, PDFs, logs, etc. The file will appear as a viewable attachment on the task.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Relative path to the file within the workspace (e.g. 'screenshots/page.png')",
        ),
    }),
    execute: wrapExecute("attachFile", async ({ path: filePath }) => {
      const resolved = resolveAndValidate(filePath);

      try {
        await fs.access(resolved);
      } catch {
        return toolErr(
          ToolErrorCode.FileNotFound,
          `File not found: ${filePath}`,
          "Use `listFiles` or `glob` to find the correct path before attaching.",
        );
      }

      await ctx.services.tasks.addTaskAttachment(ctx, taskId, {
        type: "file",
        path: filePath,
      });
      return toolOk({ attached: true, path: filePath });
    }),
  });
}
