import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

/**
 * `replyToAssigner` lets a worker task send a message back to the agent that
 * assigned it. For background tasks (created via `backgroundTask`) the assigner
 * is the agent itself; for delegated tasks the assigner is a different agent
 * (the manager). Either way, the message is enqueued as a `task_update` inbox
 * event on the assigner's main lane and the assigner wakes up to process it.
 *
 * Task-level attachments (from `attachFile` / `attachLink`) are automatically
 * included — no need to re-specify them here.
 */
export function replyToAssignerTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Send a message back to the agent that assigned this task. " +
      "Call this when you have something to report — a result, a finding, " +
      "or an update. Any files or links you attached to the task are " +
      "included automatically.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A short, conversational message. Attached files are rendered " +
            "inline for the assigner, so just reference what you did rather " +
            'than repeating the content. e.g. "Completed the report." or ' +
            '"Here are the results so far."',
        ),
    }),
    execute: async ({ message }) => {
      const task = await ctx.services.tasks.getTask(ctx, taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      // Background tasks omit assignerAgentId — fall back to the worker.
      const assignerAgentId = task.assignerAgentId ?? task.agentId;

      // Auto-fetch all task-level attachments so the main lane gets them
      // without the task lane having to re-specify them.
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
