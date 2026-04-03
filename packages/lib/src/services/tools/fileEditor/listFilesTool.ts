import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import { getWorkspacePath, resolveAndValidate } from "./pathUtils.js";

const MAX_ENTRIES = 500;

/**
 * Tool that lists files and directories in the workspace.
 * Gives agents file discovery without needing to shell out to `ls` or `find`.
 */
export function listFilesTool() {
  return tool({
    description:
      "List files and directories at a given path in the workspace. " +
      "Returns names with a trailing / for directories. " +
      "Use this to explore the workspace structure before reading or editing files.",
    inputSchema: z.object({
      path: z
        .string()
        .optional()
        .default("")
        .describe(
          "Directory path relative to workspace root. Omit or pass empty string for workspace root.",
        ),
    }),
    execute: async ({ path: dirPath }) => {
      const resolved = dirPath
        ? resolveAndValidate(dirPath)
        : getWorkspacePath();

      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(resolved, { withFileTypes: true });
      } catch {
        return { error: `Directory not found: ${dirPath || "/"}` };
      }

      const items = entries
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        .sort()
        .slice(0, MAX_ENTRIES);

      return {
        path: dirPath || "/",
        entries: items,
        ...(entries.length > MAX_ENTRIES
          ? { truncated: true, total: entries.length }
          : {}),
      };
    },
  });
}
