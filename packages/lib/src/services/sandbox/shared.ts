export const COMMAND_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
export const MAX_OUTPUT_CHARS = 20_000;

export interface ExecOptions {
  pubsub?: import("../../resources/pubsub.js").PubSub;
  taskId?: string;
}

export function truncate(s: string): string {
  if (s.length <= MAX_OUTPUT_CHARS) return s;
  return (
    s.slice(0, MAX_OUTPUT_CHARS / 2) +
    "\n... [output truncated] ...\n" +
    s.slice(-MAX_OUTPUT_CHARS / 2)
  );
}

/**
 * Limit output to a given number of lines from the head or tail.
 * Returns `{ text, totalLines, limited }`.
 */
export function limitLines(
  s: string,
  opts: { maxLines?: number; tail?: number },
): { text: string; totalLines: number; limited: boolean } {
  if (!opts.maxLines && !opts.tail) {
    return { text: s, totalLines: 0, limited: false };
  }
  const lines = s.split("\n");
  const totalLines = lines.length;

  if (opts.tail) {
    const n = Math.min(opts.tail, totalLines);
    if (n >= totalLines) return { text: s, totalLines, limited: false };
    return {
      text: `... [${totalLines - n} lines hidden, showing last ${n}]\n${lines.slice(-n).join("\n")}`,
      totalLines,
      limited: true,
    };
  }

  const n = Math.min(opts.maxLines ?? totalLines, totalLines);
  if (n >= totalLines) return { text: s, totalLines, limited: false };
  return {
    text: `${lines.slice(0, n).join("\n")}\n... [${totalLines - n} more lines, ${totalLines} total]`,
    totalLines,
    limited: true,
  };
}
