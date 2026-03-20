import { ToolName } from "../../graphql/generated/graphql";
import type { ChatMessage } from "../../hooks/useLogMessages";

export { ToolName };

export function safeParseJson(
  s: string | null | undefined,
): Record<string, unknown> | null {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export type ResolvedTool = {
  name: ToolName | (string & {});
  input: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
};

const KNOWN_TOOLS = new Set<string>(Object.values(ToolName));

/** Returns true if `name` is a known ToolName. Narrows the type for switch exhaustiveness. */
export function isKnownTool(name: string): name is ToolName {
  return KNOWN_TOOLS.has(name);
}

/** Normalize tool fields -- handles both typed columns and legacy JSON-in-content */
export function resolveToolFields(entry: ChatMessage): ResolvedTool {
  if (entry.toolName) {
    return {
      name: entry.toolName,
      input: safeParseJson(entry.toolInput),
      result: safeParseJson(entry.toolResult),
    };
  }
  // Legacy: tool data was JSON-stringified into content
  const parsed = safeParseJson(entry.content);
  if (parsed?.name) {
    return {
      name: parsed.name as string,
      input: (parsed.input as Record<string, unknown>) ?? null,
      result: (parsed.result as Record<string, unknown>) ?? null,
    };
  }
  return { name: "tool", input: null, result: null };
}
