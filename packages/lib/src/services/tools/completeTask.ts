import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

/**
 * `completeTask` marks the current task as done and delivers the result
 * back to the main conversation. For background tasks the result goes to
 * the same agent's main lane; for delegated tasks it goes to the manager.
 *
 * Task-level attachments (from `attachFile` / `attachLink`) are automatically
 * included — no need to re-specify them here.
 */
export function completeTaskTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Mark the task as complete and report your result.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A short summary of what you accomplished. Attached files are " +
            "rendered inline, so just reference what you did rather " +
            'than repeating the content. e.g. "Done — report generated." or ' +
            '"Here are the results."',
        ),
    }),
    execute: async ({ message }) => {
      const task = await ctx.services.tasks.getTask(ctx, taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      const assignerAgentId = task.assignerAgentId ?? task.agentId;

      const attachments = await ctx.services.tasks.getTaskAttachments(
        ctx,
        taskId,
      );

      await ctx.services.inbox.enqueueWork(ctx, assignerAgentId, "main", {
        type: "task_update",
        payload: {
          taskId,
          fromAgentId: task.agentId,
          message,
          ...(attachments.length ? { attachments } : {}),
        },
      });

      return { sent: true };
    },
  });
}
