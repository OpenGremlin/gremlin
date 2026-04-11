import { execFile } from "node:child_process";
import * as path from "node:path";
import { getWorkspacePath } from "./workspacePath.js";

export type SearchMode = "FILENAME" | "CONTENT" | "ALL";

export interface SearchResult {
  path: string;
  name: string;
  matchType: "filename" | "content";
  matchLine: number | null;
  matchContent: string | null;
  matchContextBefore: string[] | null;
  matchContextAfter: string[] | null;
}

const MAX_RESULTS = 100;
const TIMEOUT_MS = 5000;

function runRg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "rg",
      args,
      { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          // Exit code 1 = no matches, exit code 2 = error
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            reject(new Error("ripgrep is not installed"));
            return;
          }
          const exitCode = (err as { code?: number }).code;
          if (exitCode === 1) {
            resolve("");
            return;
          }
          reject(err);
          return;
        }
        resolve(stdout);
      },
    );
  });
}

interface RgJsonMatch {
  type: "match";
  data: {
    path: { text: string };
    line_number: number;
    lines: { text: string };
    submatches: Array<{ match: { text: string }; start: number; end: number }>;
  };
}

interface RgJsonContext {
  type: "context";
  data: {
    path: { text: string };
    line_number: number;
    lines: { text: string };
  };
}

type RgJsonLine = RgJsonMatch | RgJsonContext | { type: string };

async function searchContent(query: string): Promise<SearchResult[]> {
  const workspacePath = getWorkspacePath();
  const stdout = await runRg([
    "--json",
    "-i",
    "-F",
    "-C",
    "1",
    "--max-count",
    "3",
    "--max-filesize",
    "1M",
    query,
    workspacePath,
  ]);

  if (!stdout) return [];

  const lines = stdout.trim().split("\n");
  const results: SearchResult[] = [];

  // rg --json emits context lines before the match, then the match, then
  // context lines after. We buffer "pending" context lines and flush them
  // as before-context once we hit a match.
  let pendingContextBefore: string[] = [];
  let lastMatch: {
    filePath: string;
    lineNumber: number;
    lineText: string;
    contextBefore: string[];
    contextAfter: string[];
  } | null = null;

  function flushMatch() {
    if (!lastMatch) return;
    const relativePath = path.relative(workspacePath, lastMatch.filePath);
    if (relativePath.startsWith("..")) {
      lastMatch = null;
      return;
    }

    results.push({
      path: relativePath,
      name: path.basename(relativePath),
      matchType: "content",
      matchLine: lastMatch.lineNumber,
      matchContent: lastMatch.lineText,
      matchContextBefore: lastMatch.contextBefore.length
        ? lastMatch.contextBefore
        : null,
      matchContextAfter: lastMatch.contextAfter.length
        ? lastMatch.contextAfter
        : null,
    });
    lastMatch = null;
  }

  for (const line of lines) {
    let parsed: RgJsonLine;
    try {
      parsed = JSON.parse(line) as RgJsonLine;
    } catch {
      continue;
    }

    if (parsed.type === "match") {
      const m = parsed as RgJsonMatch;
      // Flush any previous match (its after-context is complete)
      flushMatch();
      lastMatch = {
        filePath: m.data.path.text,
        lineNumber: m.data.line_number,
        lineText: m.data.lines.text.replace(/\n$/, ""),
        contextBefore: pendingContextBefore,
        contextAfter: [],
      };
      pendingContextBefore = [];
    } else if (parsed.type === "context") {
      const c = parsed as RgJsonContext;
      const contextLine = c.data.lines.text.replace(/\n$/, "");
      if (lastMatch && c.data.path.text === lastMatch.filePath) {
        // Context after the last match
        lastMatch.contextAfter.push(contextLine);
      } else {
        // Context before the next match
        pendingContextBefore.push(contextLine);
      }
    } else if (parsed.type === "end" || parsed.type === "begin") {
      // File boundary — flush and reset
      flushMatch();
      pendingContextBefore = [];
    }
  }
  flushMatch();

  // Deduplicate: keep first match per file
  const seenPaths = new Set<string>();
  return results
    .filter((r) => {
      if (seenPaths.has(r.path)) return false;
      seenPaths.add(r.path);
      return true;
    })
    .slice(0, MAX_RESULTS);
}

async function searchFilenames(query: string): Promise<SearchResult[]> {
  const workspacePath = getWorkspacePath();
  const stdout = await runRg(["--files", workspacePath]);

  if (!stdout) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const line of stdout.trim().split("\n")) {
    if (results.length >= MAX_RESULTS) break;
    if (!line) continue;

    const relativePath = path.relative(workspacePath, line);
    if (relativePath.startsWith("..")) continue;

    const basename = path.basename(relativePath);
    if (
      basename.toLowerCase().includes(lowerQuery) ||
      relativePath.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        path: relativePath,
        name: basename,
        matchType: "filename",
        matchLine: null,
        matchContent: null,
        matchContextBefore: null,
        matchContextAfter: null,
      });
    }
  }

  return results;
}

export async function searchFiles(
  query: string,
  mode: SearchMode,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length > 200) return [];

  if (mode === "FILENAME") {
    return searchFilenames(trimmed);
  }

  if (mode === "CONTENT") {
    return searchContent(trimmed);
  }

  // ALL mode: run both, merge with content matches taking priority
  const [contentResults, filenameResults] = await Promise.all([
    searchContent(trimmed),
    searchFilenames(trimmed),
  ]);

  const seenPaths = new Set(contentResults.map((r) => r.path));
  const merged = [...contentResults];

  for (const fr of filenameResults) {
    if (merged.length >= MAX_RESULTS) break;
    if (!seenPaths.has(fr.path)) {
      merged.push(fr);
      seenPaths.add(fr.path);
    }
  }

  return merged;
}
