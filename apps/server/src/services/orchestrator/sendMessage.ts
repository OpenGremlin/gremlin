import type { ServiceContext } from "../context.js";
import { writeAgentLog } from "./writeAgentLog.js";

export async function sendMessage(
  ctx: ServiceContext,
  agentId: string,
  content: string,
  taskId?: string | null,
) {
  // Write the user message to the log immediately
  const entry = await writeAgentLog(ctx, {
    agentId,
    taskId: taskId ?? null,
    role: "USER",
    content,
  });

  // Enqueue to inbox — the consumer drain loop handles the agent turn
  if (taskId) {
    await ctx.services.inbox.enqueueWork(ctx, agentId, {
      type: "run_task",
      payload: { taskId, prompt: content, skipLog: true },
    });
  } else {
    await ctx.services.inbox.enqueueWork(ctx, agentId, {
      type: "user_message",
      payload: { content },
    });
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
