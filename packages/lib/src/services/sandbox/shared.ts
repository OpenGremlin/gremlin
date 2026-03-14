export const COMMAND_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
export const MAX_OUTPUT_CHARS = 8_000;

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
