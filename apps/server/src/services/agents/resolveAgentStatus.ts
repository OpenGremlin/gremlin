import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

/**
 * Publish an agent status update to subscribers.
 *
 * @param statusHint - When the caller already knows the status (e.g. a task
 *   was just created/updated), pass it here to avoid a GSI read that may
 *   return stale data due to DynamoDB eventual consistency.
 */
export async function resolveAgentStatus(
  ctx: ServiceContext,
  agentId: string,
  statusHint?: "ACTIVE" | "IDLE",
): Promise<AgentItem | null> {
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  if (!agent || agent.blocked) return null;

  const status = statusHint ?? "IDLE";
  ctx.resources.pubsub.publish(`agentUpdated:${agentId}`, {
    ...agent,
    status,
  } as AgentItem & { status: string });
  return agent;
}
