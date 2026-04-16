import { TOOL_RESULT_COMPACT_THRESHOLD } from "./constants.js";

/** Tools whose results should be compacted when large. */
const COMPACTABLE_TOOLS = new Set(["runCommand"]);

/**
 * Attempt to build a compact summary for a large tool result.
 * Returns `null` if the result shouldn't be compacted.
 */
export function compactToolResult(
  toolName: string,
  resultJson: string,
): string | null {
  if (!COMPACTABLE_TOOLS.has(toolName)) return null;
  if (resultJson.length <= TOOL_RESULT_COMPACT_THRESHOLD) return null;

  try {
    const parsed = JSON.parse(resultJson);
    const exitCode = parsed.exitCode ?? "?";
    const outputLen = parsed.output?.length ?? 0;
    const truncated = parsed.outputTruncated ? " (truncated)" : "";
    const commandId = parsed.commandId
      ? ` — use readCommandOutput("${parsed.commandId}") for full output`
      : "";
    // Keep a short preview (first 200 chars of output)
    const preview = parsed.output
      ? `\nPreview: ${parsed.output.slice(0, 200)}${parsed.output.length > 200 ? "..." : ""}`
      : "";
    return `{"exitCode":${exitCode},"outputChars":${outputLen}${truncated}${commandId}}${preview}`;
  } catch {
    // Not valid JSON — fall through to default
    return null;
  }
}
