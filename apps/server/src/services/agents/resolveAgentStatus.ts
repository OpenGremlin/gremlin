import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function resolveAgentStatus(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentItem | null> {
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  if (!agent || agent.blocked) return null;

  // Publish the agent so subscriptions re-derive the computed status
  ctx.resources.pubsub.publish(`agentUpdated:${agentId}`, agent);
  return agent;
}
