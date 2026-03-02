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

/** Tools marked as internal — logged for audit but hidden from the UI. */
const INTERNAL_TOOLS = new Set(["createDocument", "updateDocument"]);

export async function runAgentTurn(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    systemPrompt: string;
    timezone?: string;
    memoryContext?: string;
    messages: ModelMessage[];
    tools?: Record<string, Tool>;
  },
): Promise<string> {
  const allTools = {
    ...opts.tools,
    requestApproval: requestApprovalTool(ctx, opts.agentId),
  };

  const tz = opts.timezone ?? "UTC";
  const currentTime = new Date().toLocaleString("en-US", { timeZone: tz });

  const result = await generateText({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: opts.systemPrompt,
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      },
      { role: "system", content: `Current time: ${currentTime} (${tz})` },
      ...(opts.memoryContext
        ? [{ role: "system" as const, content: opts.memoryContext }]
        : []),
      ...opts.messages,
    ],
    tools: allTools,
    stopWhen: [hasToolCall("requestApproval")],
    onStepFinish: async (step) => {
      // Log tool calls eagerly as each step completes, so the UI
      // shows delegated tasks before the model finishes generating text.
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
          internal: INTERNAL_TOOLS.has(toolCall.toolName),
        });
      }
    },
  });

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
