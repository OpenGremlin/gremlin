import { generateText, hasToolCall, type ModelMessage, type Tool } from "ai";
import type { ServiceContext } from "../context.js";
import { getModel } from "./model.js";
import { requestApprovalTool } from "../tools/index.js";
import { updateAgentLogResult, writeAgentLog } from "./writeAgentLog.js";

/** Tools marked as internal — logged for audit but hidden from the UI. */
const INTERNAL_TOOLS = new Set(["updateDocument"]);

/**
 * Wrap tools to emit a TOOL log entry (input only) when execution starts.
 * Returns the wrapped tools and a map of toolCallId → logEntryId for
 * updating the entry with the result later.
 */
function withEagerLogging(
  tools: Record<string, Tool>,
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): { tools: Record<string, Tool>; callLogIds: Map<string, string> } {
  const callLogIds = new Map<string, string>();
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
        const { id: logId } = await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: name,
          toolInput: input,
          toolResult: null,
          internal: false,
        });
        // Track by toolCallId from the AI SDK options
        const toolCallId = (options as { toolCallId?: string })?.toolCallId;
        if (toolCallId) callLogIds.set(toolCallId, logId);
        // @ts-expect-error — Tool execute signature varies
        return t.execute(input, options);
      },
    };
  }
  return { tools: wrapped, callLogIds };
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
  const { tools: allTools, callLogIds } = withEagerLogging(baseTools, ctx, opts.agentId, opts.taskId);

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
      for (let i = 0; i < step.toolCalls.length; i++) {
        const toolCall = step.toolCalls[i];
        const toolResult = step.toolResults[i];
        const isInternal = INTERNAL_TOOLS.has(toolCall.toolName);
        const toolCallId = "toolCallId" in toolCall ? (toolCall.toolCallId as string) : undefined;
        const existingLogId = toolCallId ? callLogIds.get(toolCallId) : undefined;

        if (existingLogId) {
          // Update the existing call entry with the result
          await updateAgentLogResult(ctx, existingLogId, {
            agentId: opts.agentId,
            taskId: opts.taskId,
            toolName: toolCall.toolName,
            toolInput: "input" in toolCall ? toolCall.input : undefined,
            toolResult: toolResult?.output,
          });
        } else {
          // Internal tools or missing callLogId — write a single combined entry
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
