import type { ModelMessage } from "ai";
import type { ServiceContext } from "../../context.js";
import { formatAttachments } from "./formatAttachments.js";

/**
 * Build a summary of the main lane conversation for task inheritance.
 * Returns recent user/agent text messages (no tool calls) so the task
 * lane has conversational context without needing it re-described.
 */
export async function buildMainLaneContext(
  ctx: ServiceContext,
  agentId: string,
): Promise<ModelMessage[]> {
  const connection = await ctx.services.agentLogs.getAgentLogs(ctx, agentId, {
    last: 30,
  });
  const entries = connection.edges.map((e) => e.node);

  const messages: ModelMessage[] = [];
  for (const entry of entries) {
    // Only include user and agent text messages — skip tool calls, system, etc.
    if (entry.role === "USER") {
      messages.push({
        role: "user",
        content: entry.content + formatAttachments(entry.attachments),
      });
    } else if (entry.role === "AGENT" && !entry.toolName) {
      messages.push({ role: "assistant", content: entry.content });
    }
  }

  return messages;
}
