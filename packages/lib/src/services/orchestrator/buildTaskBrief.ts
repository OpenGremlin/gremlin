import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

/**
 * Format a task's full context for the lane-start system message.
 * This is the prompt the agent receives on first dispatch — it contains
 * everything the agent needs to work on the task without making a
 * `taskShow` tool call.
 */
export async function buildTaskBrief(
  ctx: ServiceContext,
  task: TaskItem,
): Promise<string> {
  const parts: string[] = [];

  if (task.originJobId) {
    const job = await ctx.services.jobs
      .getJob(ctx, task.originJobId)
      .catch(() => null);
    if (job) {
      parts.push(`From scheduled job "${job.name}" (id: ${job.id}).`);
    }
  }

  const body = task.instructions ?? task.description ?? task.title;
  parts.push(body);

  if (task.expectedInput) {
    parts.push(`Expected input:\n${task.expectedInput}`);
  }

  if (task.expectedOutput) {
    parts.push(`Expected output:\n${task.expectedOutput}`);
  }

  const attachments = await ctx.services.tasks
    .getTaskAttachments(ctx, task.id)
    .catch(() => []);
  if (attachments.length > 0) {
    const lines = attachments.map((a) =>
      a.type === "file" ? `- ${a.path}` : `- ${a.url}`,
    );
    parts.push(`Attachments on this task:\n${lines.join("\n")}`);
  }

  const latestComment = await ctx.services.tasks
    .getLatestComment(ctx, task.id)
    .catch(() => undefined);
  if (latestComment) {
    parts.push(`Latest comment: ${latestComment.text}`);
  }

  return parts.join("\n\n");
}
