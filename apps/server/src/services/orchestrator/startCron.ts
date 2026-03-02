import type { ServiceContext } from "../context.js";
import { dispatchDueFollowUps } from "./dispatchDueFollowUps.js";
import { dispatchDueJobs } from "./dispatchDueJobs.js";

const INTERVAL_MS = 60_000;

/**
 * Start the 60-second cron that dispatches due TaskFollowUps and AgentJobs.
 * Returns a cleanup function to stop the interval.
 */
export function startCron(ctx: ServiceContext): () => void {
  console.log("[orchestrator] Starting cron (60s interval)");

  const interval = setInterval(() => {
    dispatchDueFollowUps(ctx).catch((err) => {
      console.error("[orchestrator] Cron tick (follow-ups) failed:", err);
    });
    dispatchDueJobs(ctx).catch((err) => {
      console.error("[orchestrator] Cron tick (jobs) failed:", err);
    });
  }, INTERVAL_MS);

  return () => {
    console.log("[orchestrator] Stopping cron");
    clearInterval(interval);
  };
}
