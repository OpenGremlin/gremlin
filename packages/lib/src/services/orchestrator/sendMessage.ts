import type { ServiceContext } from "../context.js";

export async function sendMessage(
  ctx: ServiceContext,
  agentId: string,
  content: string,
  taskId?: string | null,
) {
  // Enqueue to inbox — the consumer writes the log entry and runs inference
  if (taskId) {
    await ctx.services.inbox.enqueueWork(ctx, agentId, `task:${taskId}`, {
      type: "user_task_message",
      payload: { taskId, content },
    });
  } else {
    await ctx.services.inbox.enqueueWork(ctx, agentId, "main", {
      type: "user_message",
      payload: { content },
    });
  }

  return {
    agentId,
    taskId: taskId ?? null,
    content,
  };
}
