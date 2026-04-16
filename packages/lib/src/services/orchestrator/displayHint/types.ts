export type DisplayHint = {
  text: string;
  variant?: "success" | "error" | "warning";
  /** Short error message extracted from the tool result, if present. */
  error?: string;
};

/**
 * Per-tool hint builder. Receives parsed tool input and the normalised
 * success payload (already unwrapped from `{ ok, data }` if applicable).
 * Returns `null` when the tool should not render a status line.
 */
export type HintBuilder = (
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
) => DisplayHint | null;
