import type { ServiceContext } from "../context.js";

/**
 * Schedule a delayed agent self-follow-up via EventBridge Scheduler.
 * The schedule fires a Lambda that writes an inbox item and rings the doorbell.
 * The schedule auto-deletes after firing (ActionAfterCompletion: DELETE).
 *
 * Replaces the old approach of writing a TaskFollowUp DDB entity
 * and polling every 60 seconds.
 */
export async function createFollowUp(
  ctx: ServiceContext,
  input: {
    taskId: string;
    agentId: string;
    delayMs: number;
    prompt: string;
  },
) {
  const result = await ctx.services.inbox.createFollowUpSchedule(input);

  return {
    id: result?.scheduleId ?? crypto.randomUUID(),
    scheduledAt:
      result?.fireAt ?? new Date(Date.now() + input.delayMs).toISOString(),
  };
}
