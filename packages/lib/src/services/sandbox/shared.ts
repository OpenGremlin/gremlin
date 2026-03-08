import type { BackgroundCommand } from "./types.js";

export const SOFT_TIMEOUT_MS = 30_000;
export const HARD_TIMEOUT_MS = 120_000;
export const MAX_OUTPUT_CHARS = 8_000;

export interface ExecOptions {
  pubsub?: import("../../resources/pubsub.js").PubSub;
  taskId?: string;
}

// In-memory background task tracking, keyed by command id
export const backgroundCommands = new Map<string, BackgroundCommand>();
const BG_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Periodically prune stale background commands
setInterval(() => {
  const now = Date.now();
  for (const [id, bg] of backgroundCommands) {
    if (now - bg.startTime > BG_TTL_MS) backgroundCommands.delete(id);
  }
}, 60_000);

export function truncate(s: string): string {
  if (s.length <= MAX_OUTPUT_CHARS) return s;
  return (
    s.slice(0, MAX_OUTPUT_CHARS / 2) +
    "\n... [output truncated] ...\n" +
    s.slice(-MAX_OUTPUT_CHARS / 2)
  );
}
