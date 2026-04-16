import { ToolName } from "../../../enums.js";
import {
  extractDisplayError,
  toolResultPayload,
} from "./extractDisplayError.js";
import { hintBuilders } from "./hints/index.js";
import type { DisplayHint } from "./types.js";

export type { DisplayHint } from "./types.js";

/**
 * Compute a short, human-readable display hint for a tool call.
 * Returns `null` for tools that should not render a status line
 * (e.g. hidden internal tools, or tools with custom UI widgets).
 *
 * The backend owns the message text and semantic variant;
 * the frontend owns the icon.
 *
 * Tool results may be either a structured `GremlinToolResult<R>` (the current
 * contract) or an unwrapped legacy shape (older log entries predate the
 * unification). Both paths are tolerated.
 */
export function computeDisplayHint(
  toolName: string,
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
): DisplayHint | null {
  // Fast-path: tools with dedicated frontend widgets have no hint builder
  // registered, so the lookup below would also return null. Short-circuit
  // here to skip the result-unwrap work on every runCommand call, which is
  // the hottest path in the agent stream.
  if (
    toolName === ToolName.RequestUserInput ||
    toolName === ToolName.RunCommand
  ) {
    return null;
  }

  // Unwrap structured result so tool-specific field lookups (title, path, etc.)
  // work the same whether the raw value is `{ ok, data }` or a legacy payload.
  const payload = toolResultPayload(result);
  const builder = hintBuilders[toolName];
  const hint = builder ? builder(input, payload) : null;
  if (!hint) return null;

  const error = extractDisplayError(result);
  if (error) {
    return { ...hint, error, variant: "error" };
  }
  return hint;
}
