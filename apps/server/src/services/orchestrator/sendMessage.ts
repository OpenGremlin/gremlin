import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { runTaskLane } from "./runTaskLane.js";
import { defaultTools, delegateTaskTool } from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

export async function sendMessage(
  ctx: ServiceContext,
  agentId: string,
  content: string,
  taskId?: string | null,
) {
  // Write the user message
  const entry = await writeAgentLog(ctx, {
    agentId,
    taskId: taskId ?? null,
    role: "USER",
    content,
  });

  // Fire-and-forget the agent turn
  if (taskId) {
    runTaskLane(ctx, taskId, content, { skipLog: true }).catch((err) =>
      console.error("runTaskLane failed:", err),
    );
  } else {
    runMainLaneAgent(ctx, agentId, content).catch((err) =>
      console.error("runMainLane agent turn failed:", err),
    );
  }

  return {
    id: entry.id,
    agentId,
    taskId: taskId ?? null,
    role: "USER" as const,
    content,
    createdAt: entry.createdAt,
  };
}

/**
 * Runs the agent turn on the main lane.
 * The user message is already written by sendMessage, so we just
 * build history and call runAgentTurn directly.
 */
async function runMainLaneAgent(
  ctx: ServiceContext,
  agentId: string,
  userMessage: string,
) {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Build conversation history with compaction support
  const { messages, totalLogCount } = await buildContextMessages(ctx, {
    agentId,
    taskId: null,
  });

  // Ensure the user message is included (DDB eventual consistency may miss it)
  if (
    messages.length === 0 ||
    messages[messages.length - 1].content !== userMessage
  ) {
    messages.push({ role: "user", content: userMessage });
  }

  await runAgentTurn(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderPrompt("system", {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: profile?.displayName ?? "the user",
      userAbout: profile?.about,
    }),
    messages,
    tools: { ...defaultTools, delegateTask: delegateTaskTool(ctx, agentId) },
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, { agentId, taskId: null, messages, totalLogCount }).catch(
    (err) => console.error("compaction failed:", err),
  );
}
