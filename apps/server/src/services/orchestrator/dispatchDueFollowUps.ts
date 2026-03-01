import type { ServiceContext } from "../context.js";
import { deactivateFollowUp } from "./deactivateFollowUp.js";
import { runTaskLane } from "./runTaskLane.js";

/**
 * Query all active follow-ups that are due, deactivate them,
 * and dispatch agent turns to resume the associated tasks.
 *
 * Called every 60 seconds by the cron interval.
 */
export async function dispatchDueFollowUps(ctx: ServiceContext) {
  const followUps = await ctx.services.taskFollowUps.getActiveFollowUps(ctx);
  const now = new Date().toISOString();

  const due = followUps.filter((f) => f.scheduledAt <= now);
  if (due.length === 0) return;

  console.log(`[orchestrator] ${due.length} follow-up(s) due`);

  for (const followUp of due) {
    // Deactivate before dispatch to prevent double-firing
    await deactivateFollowUp(ctx, followUp.id);

    // Dispatch asynchronously — don't block the cron for slow turns
    runTaskLane(ctx, followUp.taskId, followUp.prompt).catch((err) => {
      console.error(
        `[orchestrator] Failed to resume task ${followUp.taskId}:`,
        err,
      );
    });
  }
}
