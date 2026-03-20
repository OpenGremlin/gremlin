import { createLogger } from "@gremlin/lib/logger.js";
import { ddb } from "@gremlin/lib/resources/ddb/index.js";
import { getAgents } from "@gremlin/lib/services/agents/getAgents.js";
import type { ServiceContext } from "@gremlin/lib/services/context.js";
import type { InboxItemType } from "@gremlin/lib/services/inbox/enqueueWork.js";
import { enqueueWork } from "@gremlin/lib/services/inbox/enqueueWork.js";

/**
 * Lambda invoked by EventBridge Scheduler for:
 * - Cron jobs (scheduled_job)
 * - Agent self-follow-ups (agent_self_followup)
 * - Core memory review (core_memory_review) — fans out to all active agents
 *
 * Writes an inbox item to DDB and rings the SQS doorbell.
 */

const log = createLogger("gremlin-schedule-target");

const ctx = {
  resources: { ddb },
  log,
} as unknown as ServiceContext;

interface ScheduleEvent {
  type: InboxItemType;
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

export async function handler(event: ScheduleEvent) {
  if (event.type === "core_memory_review") {
    const agents = await getAgents(ctx);
    const activeAgents = agents.filter((a) => !a.retired);
    const results = await Promise.all(
      activeAgents.map((agent) =>
        enqueueWork(ctx, agent.id, "system", {
          type: event.type,
          payload: event.payload,
        }),
      ),
    );
    return { statusCode: 200, ids: results.map((r) => r.id) };
  }

  if (!event.agentId) {
    throw new Error(`agentId is required for event type "${event.type}"`);
  }

  const lane = getLane(event);
  const { id } = await enqueueWork(ctx, event.agentId, lane, {
    type: event.type,
    payload: event.payload,
  });

  return { statusCode: 200, id };
}
