import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import type { FileStateTracker } from "./fileState.js";
import { resolveAndValidate } from "./pathUtils.js";

/**
 * Tool that writes (creates or overwrites) a file in the workspace.
 * Enforces read-before-write for existing files via the FileStateTracker.
 */
export function writeFileTool(
  _ctx: ServiceContext,
  tracker: FileStateTracker,
  _taskId: string | null,
) {
  return tool({
    description:
      "Write content to a file. Creates the file (and any parent directories) if it " +
      "does not exist. Overwrites the file if it already exists — you MUST read it " +
      "first with readFile. Prefer the editFile tool for surgical changes to existing files.",
    inputSchema: z.object({
      file_path: z
        .string()
        .describe(
          "Path to the file (relative to workspace root, or absolute within workspace)",
        ),
      content: z.string().describe("The full content to write to the file"),
    }),
    execute: async ({ file_path, content }) => {
      const resolved = resolveAndValidate(file_path);
      const fileExists = await exists(resolved);

      tracker.validateForWrite(resolved, fileExists);

      // Ensure parent directories exist.
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, "utf-8");

      // Clear tracked state so a fresh read is required before the next edit.
      tracker.clear(resolved);

      return {
        type: fileExists ? ("update" as const) : ("create" as const),
        file_path,
      };
    },
  });
}

async function exists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}
