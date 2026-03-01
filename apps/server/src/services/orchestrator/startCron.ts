import type { ServiceContext } from "../context.js";
import { dispatchDueFollowUps } from "./dispatchDueFollowUps.js";

const INTERVAL_MS = 60_000;

/**
 * Start the 60-second cron that dispatches due TaskFollowUps.
 * Returns a cleanup function to stop the interval.
 */
export function startCron(ctx: ServiceContext): () => void {
  console.log("[orchestrator] Starting follow-up cron (60s interval)");

  const interval = setInterval(() => {
    dispatchDueFollowUps(ctx).catch((err) => {
      console.error("[orchestrator] Cron tick failed:", err);
    });
  }, INTERVAL_MS);

  return () => {
    console.log("[orchestrator] Stopping follow-up cron");
    clearInterval(interval);
  };
}
