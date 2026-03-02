import { AgentStatus } from "../../gql/resolverTypes.js";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

const NON_TERMINAL = new Set(["PENDING", "RUNNING", "WAITING"]);

export async function resolveAgentStatus(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentItem | null> {
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  if (!agent) return null;

  // Don't override BLOCKED — the notification system owns that status
  if (agent.status === "BLOCKED") return null;

  const tasks = await ctx.services.tasks.getTasksByAgent(ctx, agentId);
  const hasActive = tasks.some((t) => NON_TERMINAL.has(t.status));
  const newStatus = hasActive ? AgentStatus.Active : AgentStatus.Idle;

  if (agent.status === newStatus) return null;

  const updated = await ctx.services.agents.updateAgentStatus(
    ctx,
    agentId,
    newStatus,
  );

  ctx.resources.pubsub.publish(`agentUpdated:${agentId}`, updated);

  return updated;
}
