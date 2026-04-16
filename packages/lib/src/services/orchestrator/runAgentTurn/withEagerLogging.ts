import type { Tool } from "ai";
import type { ToolName } from "../../../enums.js";
import type { ServiceContext } from "../../context.js";
import { writeAgentLog } from "../writeAgentLog.js";

export type CallLogRef = { logId: string; createdAt: string };

/**
 * Wrap tools to emit a TOOL log entry (input only) when execution starts.
 * Returns the wrapped tools and a map of toolCallId → logEntryId for
 * updating the entry with the result later.
 */
export function withEagerLogging(
  tools: Record<string, Tool>,
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): {
  tools: Record<string, Tool>;
  callLogIds: Map<string, CallLogRef>;
} {
  const callLogIds = new Map<string, CallLogRef>();
  const wrapped: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    wrapped[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        // Write call log immediately (no result yet)
        const { id: logId, createdAt } = await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: name as ToolName,
          toolInput: input,
          toolResult: null,
          internal: false,
        });
        // Track by toolCallId from the AI SDK options
        const toolCallId = (options as { toolCallId?: string })?.toolCallId;
        if (toolCallId) callLogIds.set(toolCallId, { logId, createdAt });
        // @ts-expect-error — Tool execute signature varies
        return t.execute(input, options);
      },
    };
  }
  return { tools: wrapped, callLogIds };
}
