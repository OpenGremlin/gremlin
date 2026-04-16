import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";
import type { FileStateTracker } from "./fileState.js";
import { resolveAndValidate } from "./pathUtils.js";

const DEFAULT_LINE_LIMIT = 2000;

/**
 * Tool that reads any text file in the workspace.
 * Records read state so that subsequent write/edit calls can detect staleness.
 */
export function readFileTool(tracker: FileStateTracker) {
  return tool({
    description:
      "Read a file from the workspace. Returns the file content with line numbers. " +
      "You can read any text file — code, config, markdown, etc. " +
      "Use offset and limit to read specific sections of large files.",
    inputSchema: z.object({
      file_path: z
        .string()
        .describe(
          "Absolute path to the file within the workspace (e.g. /workspace/src/index.ts)",
        ),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Line number to start reading from (0-based). Omit to start from the beginning.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          `Max number of lines to return. Defaults to ${DEFAULT_LINE_LIMIT}.`,
        ),
    }),
    execute: wrapExecute("readFile", async ({ file_path, offset, limit }) => {
      let resolved: string;
      try {
        resolved = resolveAndValidate(file_path);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErr(
          ToolErrorCode.PathInvalid,
          `Path escapes the workspace: ${msg}`,
          "Use paths under /workspace/ only.",
        );
      }

      let content: string;
      try {
        content = await fs.readFile(resolved, "utf-8");
      } catch {
        return toolErr(
          ToolErrorCode.FileNotFound,
          `File not found: ${resolved}`,
          "Use `listFiles` or `glob` to find the correct path, and make sure to prefix with `/workspace/`.",
        );
      }

      const lines = content.split("\n");
      const totalLines = lines.length;
      const start = offset ?? 0;
      const count = limit ?? DEFAULT_LINE_LIMIT;
      const isPartialRead = start > 0 || count < totalLines;

      const slice = lines.slice(start, start + count);
      const numbered = slice
        .map((line, i) => `${start + i + 1}\t${line}`)
        .join("\n");

      // Record the full content for staleness tracking, regardless of
      // whether we returned a partial slice to the model.
      tracker.recordRead(resolved, content, isPartialRead);

      return toolOk({
        file_path: resolved,
        totalLines,
        content: numbered,
        ...(isPartialRead
          ? { linesShown: `${start + 1}-${start + slice.length}` }
          : {}),
      });
    }),
  });
}
