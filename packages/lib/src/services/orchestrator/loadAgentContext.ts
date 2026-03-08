import type { ServiceContext } from "../context.js";

/** Load agent and profile, validate both. */
export async function loadAgentContext(ctx: ServiceContext, agentId: string) {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);
  if (agent.retired) throw new Error(`Agent ${agentId} is retired`);

  return {
    agent,
    profile,
    displayName: profile?.displayName ?? "the user",
    timezone: profile?.timezone ?? undefined,
  };
}
