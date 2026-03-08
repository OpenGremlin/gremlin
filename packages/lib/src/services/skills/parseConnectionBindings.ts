/** Parse connectionBindings JSON string into a Record<string, string>. */
export function parseConnectionBindings(
  raw: string | null | undefined,
): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}
