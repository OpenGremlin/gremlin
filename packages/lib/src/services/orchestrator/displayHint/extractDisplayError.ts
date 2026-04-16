import { extractToolError, unwrapToolData } from "../../tools/toolResult.js";

/**
 * Normalise the success payload we pass into field-lookup logic.
 * - `{ ok: true, data }` → `data`
 * - `{ ok: false, error }` → `null` (errors handled separately)
 * - legacy unwrapped object → returned as-is
 */
export function toolResultPayload(
  result: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!result) return null;
  if (typeof result.ok === "boolean") {
    if (result.ok === true) {
      const data = unwrapToolData(result);
      return data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : null;
    }
    return null;
  }
  return result;
}

/**
 * Produce the one-line error summary rendered under a failed tool status.
 * Prefers the typed `GremlinToolError` shape, falls back to common legacy
 * patterns so historical log entries still render sensibly.
 */
export function extractDisplayError(
  result: Record<string, unknown> | null,
): string | undefined {
  if (!result) return undefined;
  const typed = extractToolError(result);
  if (typed) {
    return typed.hint
      ? `${typed.code}: ${typed.message} ${typed.hint}`
      : `${typed.code}: ${typed.message}`;
  }
  // Legacy shapes from pre-GremlinToolResult log entries.
  if (typeof result.error === "string") return result.error;
  if (result.type === "error" && typeof result.message === "string") {
    return result.message;
  }
  return undefined;
}
