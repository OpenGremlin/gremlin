import { createLogger } from "@gremlin/lib/logger.js";
import { ddb } from "@gremlin/lib/resources/ddb/index.js";
import type { ServiceContext } from "@gremlin/lib/services/context.js";
import type { InboxItemType } from "@gremlin/lib/services/inbox/enqueueWork.js";
import { enqueueWork } from "@gremlin/lib/services/inbox/enqueueWork.js";

/**
 * Lambda invoked by EventBridge Scheduler for:
 * - Cron jobs (scheduled_job)
 * - Agent self-follow-ups (agent_self_followup)
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
  agentId: string;
  payload: Record<string, unknown>;
}

export async function handler(event: ScheduleEvent) {
  const { id } = await enqueueWork(ctx, event.agentId, {
    type: event.type,
    payload: event.payload,
  });

  return { statusCode: 200, id };
}
