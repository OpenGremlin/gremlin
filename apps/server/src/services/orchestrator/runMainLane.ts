import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import {
  defaultTools,
  delegateTaskTool,
  recallMemoryTool,
  saveMemoryTool,
} from "../tools/index.js";
import { runLane } from "./runLane.js";

/**
 * Run an agent turn on the main lane (user conversation thread).
 * All user messages are already in the log — this just runs inference.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentId: string,
  recallHint?: string,
): Promise<string> {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);
  if (agent.retired) throw new Error(`Agent ${agentId} is retired`);

  return runLane(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderPrompt("system", {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: profile?.displayName ?? "the user",
      userAbout: profile?.about,
    }),
    tools: {
      ...defaultTools,
      delegateTask: delegateTaskTool(ctx, agentId),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
    },
    recallHint,
    timezone: profile?.timezone ?? undefined,
  });
}
