import { createLogger } from "@gremlin/lib/logger.js";
import { ddb } from "@gremlin/lib/resources/ddb/index.js";
import type { ServiceContext } from "@gremlin/lib/services/context.js";
import { getStaleUnreadAgentIds } from "@gremlin/lib/services/inbox/getStaleUnreadAgentIds.js";
import { ringSqsDoorbells } from "@gremlin/lib/services/inbox/ringSqsDoorbells.js";

/**
 * Sweeper Lambda — runs every 3 minutes via EventBridge rule.
 * Queries GSI2 for unread inbox items older than 10 minutes
 * and re-rings doorbells for their agents.
 */

const log = createLogger("gremlin-sweeper");

const ctx = {
  resources: { ddb },
  log,
} as unknown as ServiceContext;

export async function handler() {
  const agentIds = await getStaleUnreadAgentIds(ctx);

  if (agentIds.length === 0) {
    log.info("No stale inbox items");
    return { statusCode: 200, stale: 0 };
  }

  log.info(
    { agentCount: agentIds.length },
    "Re-ringing doorbells for stale items",
  );

  await ringSqsDoorbells(ctx, agentIds);

  return { statusCode: 200, agents: agentIds.length };
}
