import { generateText, hasToolCall, type ModelMessage, type Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "./model.js";
import { requestApprovalTool } from "../tools/index.js";
import { writeAgentLog } from "./writeAgentLog.js";

/** Tools marked as internal — logged for audit but hidden from the UI. */
const INTERNAL_TOOLS = new Set(["updateDocument"]);

/** Wrap tools to emit a TOOL log entry (input only) when execution starts. */
function withEagerLogging(
  tools: Record<string, Tool>,
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): Record<string, Tool> {
  const wrapped: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    if (INTERNAL_TOOLS.has(name)) {
      wrapped[name] = t;
      continue;
    }
    wrapped[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        // Write call log immediately (no result yet)
        await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: name,
          toolInput: input,
          toolResult: null,
          internal: false,
        });
        // @ts-expect-error — Tool execute signature varies
        return t.execute(input, options);
      },
    };
  }
  return wrapped;
}

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
  const baseTools = {
    ...opts.tools,
    requestApproval: requestApprovalTool(ctx, opts.agentId),
  };

  // Wrap tools to emit a call log immediately when execution starts
  const allTools = withEagerLogging(baseTools, ctx, opts.agentId, opts.taskId);

  const tz = opts.timezone ?? "UTC";
  const currentTime = new Date().toLocaleString("en-US", { timeZone: tz });

  const result = await generateText({
    model: await getModel(ctx),
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
      // Log tool results as each step completes.
      // For non-internal tools, the call log (input only) was already
      // written by withEagerLogging — this writes the result entry.
      // For internal tools, write a single combined entry (not eager-logged).
      for (let i = 0; i < step.toolCalls.length; i++) {
        const toolCall = step.toolCalls[i];
        const toolResult = step.toolResults[i];
        const isInternal = INTERNAL_TOOLS.has(toolCall.toolName);
        await writeAgentLog(ctx, {
          agentId: opts.agentId,
          taskId: opts.taskId,
          role: "TOOL",
          toolName: toolCall.toolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          internal: isInternal,
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
