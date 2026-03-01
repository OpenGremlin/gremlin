import { generateText, stepCountIs, type ModelMessage, type Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "./model.js";
import { writeAgentLog } from "./writeAgentLog.js";

const MAX_STEPS = 10;

export async function runAgentTurn(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    systemPrompt: string;
    messages: ModelMessage[];
    tools: Record<string, Tool>;
  },
): Promise<string> {
  const result = await generateText({
    model: getModel(),
    system: opts.systemPrompt,
    messages: opts.messages,
    tools: opts.tools,
    stopWhen: stepCountIs(MAX_STEPS),
  });

  // Log each step's tool calls
  for (const step of result.steps) {
    for (const toolCall of step.toolCalls) {
      await writeAgentLog(ctx, {
        agentId: opts.agentId,
        taskId: opts.taskId,
        role: "tool",
        content: JSON.stringify({
          name: toolCall.toolName,
          input: "input" in toolCall ? toolCall.input : undefined,
        }),
      });
    }
  }

  // Log the final text response
  if (result.text) {
    await writeAgentLog(ctx, {
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "agent",
      content: result.text,
    });
  }

  return result.text;
}
