import type { ModelMessage } from "ai";
import type { ServiceContext } from "../context.js";
import { runAgentTurn } from "./runAgentTurn.js";
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

  // Build conversation history from main thread logs
  const logs = await ctx.services.agentLogs.getAgentLogs(ctx, agentId);
  const messages: ModelMessage[] = logs.map((log) => ({
    role: log.role === "agent" ? "assistant" : "user",
    content: log.content,
  }));

  const response = await runAgentTurn(ctx, {
    agentId,
    taskId: null,
    systemPrompt: agent.soul,
    messages,
    tools: defaultTools,
  });

  return response;
}
