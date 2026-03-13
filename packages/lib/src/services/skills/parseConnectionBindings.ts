/** Parse connectionBindings JSON string into a Record<string, string[]>. */
export function parseConnectionBindings(
  raw: string | null | undefined,
): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string | string[]>;
    // Normalize old single-string format to arrays
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      result[key] = Array.isArray(value) ? value : [value];
    }
    return result;
  } catch {
    return {};
  }
}
