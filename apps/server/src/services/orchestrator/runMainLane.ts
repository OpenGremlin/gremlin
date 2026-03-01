import type { ServiceContext } from "../context.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { renderSystemPrompt } from "./prompts.js";
import { defaultTools } from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on the main lane (user conversation thread).
 * The main lane is always free — this never blocks on tasks.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentId: string,
  userMessage: string,
): Promise<string> {
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Log the user message
  await writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "user",
    content: userMessage,
  });

  // Build conversation history with compaction support
  const { messages, totalLogCount } = await buildContextMessages(ctx, {
    agentId,
    taskId: null,
  });

  const response = await runAgentTurn(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderSystemPrompt({ name: agent.name, soul: agent.soul }),
    messages,
    tools: defaultTools,
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, { agentId, taskId: null, messages, totalLogCount }).catch(
    (err) => console.error("compaction failed:", err),
  );

  return response;
}
