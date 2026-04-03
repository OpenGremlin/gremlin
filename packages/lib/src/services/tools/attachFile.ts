import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { getWorkspacePath } from "./fileEditor/index.js";

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
    execute: async ({ path: filePath }) => {
      const workspace = getWorkspacePath();
      const resolved = path.resolve(workspace, filePath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path traversal not allowed");
      }

      try {
        await fs.access(resolved);
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }

      await ctx.services.tasks.addTaskAttachment(ctx, taskId, {
        type: "file",
        path: filePath,
      });
      return { attached: true, path: filePath };
    },
  });
}
