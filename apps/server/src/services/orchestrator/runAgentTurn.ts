import {
  generateText,
  hasToolCall,
  type ModelMessage,
  type Tool,
} from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "./model.js";
import { requestApprovalTool } from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

export async function runAgentTurn(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    systemPrompt: string;
    messages: ModelMessage[];
    tools?: Record<string, Tool>;
  },
): Promise<string> {
  const allTools = {
    ...opts.tools,
    requestApproval: requestApprovalTool(ctx, opts.agentId),
  };
  const result = await generateText({
    model: getModel(),
    system: opts.systemPrompt,
    messages: opts.messages,
    tools: allTools,
    stopWhen: [hasToolCall("requestApproval")],
  });

  // Log each step's tool calls with their results
  for (const step of result.steps) {
    for (let i = 0; i < step.toolCalls.length; i++) {
      const toolCall = step.toolCalls[i];
      const toolResult = step.toolResults[i];
      await writeAgentLog(ctx, {
        agentId: opts.agentId,
        taskId: opts.taskId,
        role: "TOOL",
        toolName: toolCall.toolName,
        toolInput: "input" in toolCall ? toolCall.input : undefined,
        toolResult: toolResult?.output,
      });
    }
  }

  // Log the final text response
  if (result.text) {
    await writeAgentLog(ctx, {
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "AGENT",
      content: result.text,
    });
  }

  return result.text;
}
