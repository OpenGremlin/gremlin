import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import {
  type GremlinToolResult,
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../toolResult.js";
import { getWorkspacePath, resolveAndValidate } from "./pathUtils.js";

const DEFAULT_HEAD_LIMIT = 250;
const MAX_LINE_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — skip huge files

/**
 * Tool that searches file contents by regex within the workspace.
 * Pure Node.js implementation (no ripgrep dependency).
 */
export function grepTool() {
  return tool({
    description:
      "Search file contents using a regular expression. Returns matching lines with " +
      "file paths and line numbers. Use this to find where functions, variables, " +
      "strings, or patterns appear in the codebase.\n\n" +
      'Supports full regex syntax (e.g. "log.*Error", "function\\\\s+\\\\w+").\n' +
      "Default output mode is files_with_matches (file paths only). " +
      'Use output_mode: "content" to see matching lines.',
    inputSchema: z.object({
      pattern: z.string().describe("Regular expression pattern to search for"),
      path: z
        .string()
        .optional()
        .describe(
          "Absolute path to a file or directory within the workspace (e.g. /workspace/src). Omit for workspace root.",
        ),
      glob: z
        .string()
        .optional()
        .describe(
          'Glob pattern to filter files (e.g. "*.ts", "*.{js,jsx}"). Only files matching this pattern are searched.',
        ),
      output_mode: z
        .enum(["content", "files_with_matches", "count"])
        .optional()
        .default("files_with_matches")
        .describe(
          'Output mode: "content" shows matching lines, "files_with_matches" shows file paths (default), "count" shows match counts per file.',
        ),
      case_insensitive: z
        .boolean()
        .optional()
        .default(false)
        .describe("Case insensitive search"),
      context_lines: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Number of lines to show before and after each match. Only applies to content mode.",
        ),
      head_limit: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          `Max entries to return. Defaults to ${DEFAULT_HEAD_LIMIT}. Pass 0 for unlimited.`,
        ),
    }),
    execute: wrapExecute(
      "grep",
      async ({
        pattern,
        path: searchPath,
        glob: globPattern,
        output_mode,
        case_insensitive,
        context_lines,
        head_limit,
      }): Promise<GremlinToolResult<unknown>> => {
        let regex: RegExp;
        try {
          regex = new RegExp(pattern, case_insensitive ? "i" : "");
        } catch {
          return toolErr(
            ToolErrorCode.InvalidInput,
            `Invalid regex: ${pattern}`,
            "Escape regex metacharacters or wrap in `\\Q...\\E`.",
          );
        }

        const workspace = getWorkspacePath();
        let target: string;
        try {
          target = searchPath ? resolveAndValidate(searchPath) : workspace;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return toolErr(
            ToolErrorCode.PathInvalid,
            `Path escapes the workspace: ${msg}`,
            "Use paths under /workspace/ only.",
          );
        }

        // Determine if target is a file or directory.
        let targetStat: Awaited<ReturnType<typeof fs.stat>>;
        try {
          targetStat = await fs.stat(target);
        } catch {
          return toolErr(
            ToolErrorCode.FileNotFound,
            `Path not found: ${searchPath ?? "/"}`,
            "Use `listFiles` or `glob` to find the correct path, and make sure to prefix with `/workspace/`.",
          );
        }

        let files: string[];
        if (targetStat.isFile()) {
          files = [target];
        } else {
          files = await collectFiles(target, workspace, globPattern);
        }

        // Search each file.
        const matches: FileMatch[] = [];
        for (const file of files) {
          const fileMatch = await searchFile(file, regex, context_lines ?? 0);
          if (fileMatch) matches.push(fileMatch);
        }

        // Apply head limit.
        const limit =
          head_limit === 0
            ? Number.POSITIVE_INFINITY
            : (head_limit ?? DEFAULT_HEAD_LIMIT);

        if (output_mode === "content") {
          return toolOk(formatContentMode(matches, limit));
        }
        if (output_mode === "count") {
          return toolOk(formatCountMode(matches, limit));
        }
        return toolOk(formatFilesMode(matches, limit));
      },
    ),
  });
}

// ── Types ────────────────────────────────────────────────────────────

interface LineMatch {
  lineNumber: number;
  line: string;
}

interface FileMatch {
  filePath: string;
  matches: LineMatch[];
}

// ── File collection ──────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  ".next",
  "__pycache__",
  ".turbo",
]);

async function collectFiles(
  dir: string,
  workspace: string,
  globPattern: string | undefined,
): Promise<string[]> {
  const fg = await import("fast-glob");
  const pattern = globPattern ?? "**/*";
  const files = await fg.default(pattern, {
    cwd: dir,
    dot: false,
    onlyFiles: true,
    absolute: true,
    suppressErrors: true,
    followSymbolicLinks: false,
    ignore: [...SKIP_DIRS].map((d) => `**/${d}/**`),
  });
  // Safety: only files within workspace.
  return files.filter((f) => f.startsWith(`${workspace}/`));
}

// ── File searching ───────────────────────────────────────────────────

async function searchFile(
  filePath: string,
  regex: RegExp,
  contextLines: number,
): Promise<FileMatch | null> {
  let content: string;
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_FILE_SIZE) return null;
    content = await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }

  // Quick check — skip file if no match.
  if (!regex.test(content)) return null;

  const lines = content.split("\n");
  const matchingLineIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      matchingLineIndices.push(i);
    }
  }

  if (matchingLineIndices.length === 0) return null;

  // Expand with context lines and deduplicate.
  const includeSet = new Set<number>();
  for (const idx of matchingLineIndices) {
    const start = Math.max(0, idx - contextLines);
    const end = Math.min(lines.length - 1, idx + contextLines);
    for (let i = start; i <= end; i++) {
      includeSet.add(i);
    }
  }

  const sortedIndices = [...includeSet].sort((a, b) => a - b);
  const matchLines: LineMatch[] = sortedIndices.map((i) => ({
    lineNumber: i + 1,
    line:
      lines[i].length > MAX_LINE_LENGTH
        ? `${lines[i].slice(0, MAX_LINE_LENGTH)}...`
        : lines[i],
  }));

  return { filePath, matches: matchLines };
}

// ── Output formatters ────────────────────────────────────────────────

function formatContentMode(
  matches: FileMatch[],
  limit: number,
): {
  content: string;
  numFiles: number;
  numLines: number;
  truncated?: boolean;
} {
  const lines: string[] = [];
  let fileCount = 0;

  for (const file of matches) {
    for (const m of file.matches) {
      if (lines.length >= limit) {
        return {
          content: lines.join("\n"),
          numFiles: fileCount,
          numLines: lines.length,
          truncated: true,
        };
      }
      lines.push(`${file.filePath}:${m.lineNumber}:${m.line}`);
    }
    fileCount++;
  }

  if (lines.length === 0) {
    return { content: "No matches found", numFiles: 0, numLines: 0 };
  }

  return {
    content: lines.join("\n"),
    numFiles: fileCount,
    numLines: lines.length,
  };
}

function formatCountMode(
  matches: FileMatch[],
  limit: number,
): {
  counts: string;
  numFiles: number;
  numMatches: number;
  truncated?: boolean;
} {
  let totalMatches = 0;
  const lines: string[] = [];

  for (const file of matches) {
    if (lines.length >= limit) {
      return {
        counts: lines.join("\n"),
        numFiles: lines.length,
        numMatches: totalMatches,
        truncated: true,
      };
    }
    lines.push(`${file.filePath}:${file.matches.length}`);
    totalMatches += file.matches.length;
  }

  if (lines.length === 0) {
    return { counts: "No matches found", numFiles: 0, numMatches: 0 };
  }

  return {
    counts: lines.join("\n"),
    numFiles: lines.length,
    numMatches: totalMatches,
  };
}

function formatFilesMode(
  matches: FileMatch[],
  limit: number,
): {
  files: string[];
  numFiles: number;
  truncated?: boolean;
} {
  if (matches.length === 0) {
    return { files: [], numFiles: 0 };
  }

  const truncated = matches.length > limit;
  const sliced = matches.slice(0, limit);

  return {
    files: sliced.map((m) => m.filePath),
    numFiles: sliced.length,
    ...(truncated ? { truncated: true, total: matches.length } : {}),
  };
}
