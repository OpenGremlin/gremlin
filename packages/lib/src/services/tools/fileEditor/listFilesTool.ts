import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";
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
          "Absolute directory path within the workspace (e.g. /workspace/src). Omit or pass empty string for workspace root.",
        ),
    }),
    execute: wrapExecute("listFiles", async ({ path: dirPath }) => {
      let resolved: string;
      try {
        resolved = dirPath ? resolveAndValidate(dirPath) : getWorkspacePath();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErr(
          ToolErrorCode.PathInvalid,
          `Path escapes the workspace: ${msg}`,
          "Use paths under /workspace/ only.",
        );
      }

      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(resolved, { withFileTypes: true });
      } catch {
        return toolErr(
          ToolErrorCode.FileNotFound,
          `Directory not found: ${resolved}`,
          "Use `listFiles` on the parent directory or `glob` to discover the correct path.",
        );
      }

      const items = entries
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        .sort()
        .slice(0, MAX_ENTRIES);

      return toolOk({
        path: resolved,
        entries: items,
        ...(entries.length > MAX_ENTRIES
          ? { truncated: true, total: entries.length }
          : {}),
      });
    }),
  });
}
