import { getAgents } from "../agents/getAgents.js";
import type { ServiceContext } from "../context.js";
import { ringDoorbell } from "./consumer.js";
import type { InboxItemType } from "./enqueueWork.js";
import { enqueueWork } from "./enqueueWork.js";
import { getStaleUnreadTargets } from "./getStaleUnreadAgentIds.js";

export interface ScheduleEvent {
  type: InboxItemType | "stale_renotify";
  agentId?: string;
  payload: Record<string, unknown>;
}

function getLane(event: ScheduleEvent): string {
  switch (event.type) {
    case "agent_self_followup":
      return `task:${event.payload.taskId as string}`;
    case "scheduled_job":
    case "core_memory_review":
      return "system";
    default:
      return "main";
  }
}

/**
 * Handle a schedule event received via SQS (from EventBridge Scheduler).
 * Writes inbox item(s) to DDB then rings the doorbell directly.
 */
export async function handleScheduleEvent(
  ctx: ServiceContext,
  event: ScheduleEvent,
) {
  if (event.type === "stale_renotify") {
    const targets = await getStaleUnreadTargets(ctx);
    if (targets.length === 0) {
      ctx.log.info("No stale inbox items");
      return;
    }
    ctx.log.info(
      { targetCount: targets.length },
      "Re-ringing doorbells for stale items",
    );
    await Promise.all(
      targets.map((t) =>
        ringDoorbell(ctx, t.agentId, t.lane).catch((err) =>
          ctx.log.error({ err, agentId: t.agentId }, "Stale doorbell failed"),
        ),
      ),
    );
    return;
  }

  if (event.type === "core_memory_review") {
    const agents = await getAgents(ctx);
    const activeAgents = agents.filter((a) => !a.retired);
    await Promise.all(
      activeAgents.map(async (agent) => {
        await enqueueWork(
          ctx,
          agent.id,
          "system",
          { type: event.type as InboxItemType, payload: event.payload },
          { skipDoorbell: true },
        );
        ringDoorbell(ctx, agent.id, "system").catch((err) =>
          ctx.log.error({ err, agentId: agent.id }, "Doorbell failed"),
        );
      }),
    );
    ctx.log.info(
      { agentCount: activeAgents.length },
      "core_memory_review fan-out complete",
    );
    return;
  }

  if (!event.agentId) {
    ctx.log.error(
      { type: event.type },
      "Schedule event missing agentId, skipping",
    );
    return;
  }

  const lane = getLane(event);
  await enqueueWork(
    ctx,
    event.agentId,
    lane,
    {
      type: event.type as InboxItemType,
      payload: event.payload,
    },
    { skipDoorbell: true },
  );

  ringDoorbell(ctx, event.agentId, lane).catch((err) =>
    ctx.log.error({ err, agentId: event.agentId }, "Doorbell failed"),
  );
}
