import type { ServiceContext } from "../../context.js";
import { reconcile } from "../../orchestrator/reconcileTasks.js";
import { executeApprovedCommand } from "./executeApprovedCommand.js";
import { activeLanes, laneKey } from "./laneTracking.js";
import { processMainLaneItems } from "./processMainLaneItems.js";
import { processSystemItems } from "./processSystemItems.js";
import { processTaskGroup } from "./processTaskGroup.js";

/**
 * Ring the doorbell for a specific agent + lane.
 * If the lane is already draining, this is a no-op — the active drain
 * loop will re-check the inbox after its current turn finishes.
 */
export async function ringDoorbell(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
): Promise<void> {
  const key = laneKey(agentId, lane);

  if (activeLanes.has(key)) {
    ctx.log.info({ agentId, lane }, "Lane already active, skipping doorbell");
    return;
  }

  ctx.log.info({ agentId, lane }, "Lane waking up");
  activeLanes.add(key);
  try {
    const agentLaneCtx = await ctx.services.orchestrator.buildAgentLaneContext(
      ctx,
      agentId,
    );

    while (true) {
      const items = await ctx.services.inbox.getUnreadItems(ctx, agentId, lane);
      if (items.length === 0) break;

      ctx.log.info(
        {
          agentId,
          lane,
          itemCount: items.length,
          types: items.map((i) => i.type),
        },
        "Lane picked up inbox items",
      );

      await ctx.services.inbox.markRead(ctx, items);

      if (lane === "main") {
        await processMainLaneItems(ctx, agentLaneCtx, agentId, items);
        await reconcile(ctx, agentId);
      } else if (lane.startsWith("task:")) {
        const taskId = lane.slice(5);

        // Guard: don't start a new turn if there's a pending command approval.
        // Items stay marked read — when the approval resolves, the doorbell
        // will re-trigger and the consumer will process them.
        const pending = await ctx.services.shellGuard.hasPendingApproval(
          ctx,
          agentId,
          taskId,
        );
        if (pending) {
          ctx.log.info(
            { agentId, taskId, lane },
            "Skipping turn — pending command approval",
          );
          break;
        }

        // Check if any items are resume_task — these skip the prompt flow
        // and re-run inference directly from existing conversation history.
        const resumeItems = items.filter((i) => i.type === "resume_task");
        const nonResumeItems = items.filter((i) => i.type !== "resume_task");

        // If a resume carries an approvalId, execute the approved command
        // (or write denial) before resuming inference. This runs inside the
        // drain loop so activeLanes blocks concurrent doorbells.
        for (const ri of resumeItems) {
          const rPayload = JSON.parse(ri.payload);
          if (rPayload.approvalId) {
            await executeApprovedCommand(ctx, rPayload.approvalId);
          }
        }

        if (nonResumeItems.length > 0) {
          await processTaskGroup(
            ctx,
            agentLaneCtx,
            agentId,
            taskId,
            nonResumeItems,
          );
        } else if (resumeItems.length > 0) {
          await ctx.services.orchestrator.resumeTaskLane(
            ctx,
            agentLaneCtx,
            taskId,
          );
        }

        // Reconcile after task lane completes — the worker may have closed a task,
        // unblocking downstream work or completing an epic.
        await reconcile(ctx, agentId);
      } else if (lane === "system") {
        await processSystemItems(ctx, agentId, items);
      }
    }
  } catch (err) {
    ctx.log.error({ err, agentId, lane }, "Lane drain error");
  } finally {
    ctx.log.info({ agentId, lane }, "Lane going back to sleep");
    activeLanes.delete(key);
  }
}
