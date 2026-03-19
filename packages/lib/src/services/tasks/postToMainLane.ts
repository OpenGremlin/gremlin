import type { ServiceContext } from "../context.js";
import type { Attachment } from "./attachment.js";

export async function postToMainLane(
  ctx: ServiceContext,
  taskId: string,
  message: string,
  attachments?: Attachment[],
) {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId: null,
    role: "AGENT",
    content: message,
    attachments,
  });
}
