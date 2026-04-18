/**
 * Returns true when `topic` is allowed by any pattern in `patterns`.
 * Patterns are either exact strings (`gmail:marvinli@gmail.com`) or
 * trailing-wildcard prefixes (`gmail:*`). No other glob syntax.
 */
export function scopeMatch(
  patterns: readonly string[],
  topic: string,
): boolean {
  for (const p of patterns) {
    if (p === topic) return true;
    if (p.endsWith(":*") && topic.startsWith(p.slice(0, -1))) return true;
    if (p === "*") return true;
  }
  return false;
}
