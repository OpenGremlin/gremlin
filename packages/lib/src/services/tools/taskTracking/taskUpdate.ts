import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";

export function taskUpdate(ctx: ServiceContext) {
  return tool({
    description: "Update a task's status, fields, or escalate it.",
    inputSchema: z.object({
      taskId: z.string().describe("The task ID to update"),
      status: z
        .enum(["open", "in_progress", "closed"])
        .optional()
        .describe(
          "New status. 'closed' = work complete (requires notes). 'open' on a closed task = reject and send back for revision (requires notes explaining what to change).",
        ),
      escalate: z
        .boolean()
        .optional()
        .describe(
          "Set to true to escalate this task to the assigner. Requires a notes comment explaining the issue. The task stays in_progress while the assigner resolves it.",
        ),
      priority: z
        .number()
        .int()
        .min(0)
        .max(4)
        .optional()
        .describe("New priority 0 (critical) to 4 (backlog)"),
      description: z.string().optional().describe("Updated description"),
      deferUntil: z
        .string()
        .optional()
        .describe(
          "ISO 8601 date — task won't appear in ready queue until this date",
        ),
      notes: z
        .string()
        .optional()
        .describe(
          "A comment to add to the task's activity log. Required when closing, escalating, or reopening a closed task.",
        ),
    }),
    execute: wrapExecute(
      "taskUpdate",
      async ({
        taskId,
        status,
        escalate,
        priority,
        description,
        deferUntil,
        notes,
      }) => {
        if ((escalate || status === "closed") && !notes) {
          return escalate
            ? toolErr(
                ToolErrorCode.InvalidInput,
                "Escalating requires a notes comment explaining what's missing or wrong.",
                "Add a `notes` field summarizing the issue before escalating.",
              )
            : toolErr(
                ToolErrorCode.InvalidInput,
                "Closing a task requires a notes comment summarizing what was produced.",
                "Add a `notes` field describing the work you completed before closing.",
              );
        }

        // Single fetch covers both the reopen-rejection validation and the
        // redundant-close short-circuit — they can't both fire for the same
        // call (different `status` branches).
        const existing =
          status === "open" || status === "closed"
            ? await ctx.services.tasks.getTask(ctx, taskId)
            : null;

        // Reopening a closed task is a rejection — the worker will wake up and
        // try to address your feedback, so an explanation is required.
        if (
          status === "open" &&
          existing?.status === "closed" &&
          !notes?.trim()
        ) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            "Reopening a closed task requires a notes comment explaining what needs to change.",
            "Add a `notes` field describing what's wrong or what to redo before reopening.",
          );
        }

        // Redundant-close short-circuit: if the task is already closed, bail
        // before side effects to avoid duplicate comments and cascading
        // `task_ready_for_review` notifications to the parent epic.
        if (status === "closed" && existing?.status === "closed") {
          return toolOk(existing);
        }

        if (status === "closed") {
          await ctx.services.tasks.closeTask(ctx, taskId, notes);
        } else if (status) {
          await ctx.services.tasks.updateTaskStatus(ctx, taskId, status, notes);
        }

        const hasFieldUpdates =
          priority != null || description != null || deferUntil != null;

        if (hasFieldUpdates) {
          await ctx.services.tasks.updateTaskFields(ctx, taskId, {
            priority,
            description,
            deferUntil,
          });
        }

        if (notes) {
          await ctx.services.tasks.addComment(ctx, {
            taskId,
            author: "agent",
            text: notes,
          });
        }

        // Notify the parent lane (or main lane for top-level tasks) on
        // escalation or closure. Child tasks route to their parent's
        // task lane so the epic can coordinate; standalone tasks route to
        // the main lane as before.
        if (escalate || status === "closed") {
          const task = await ctx.services.tasks.getTask(ctx, taskId);
          if (task) {
            if (escalate) {
              await ctx.services.tasks.incrementEscalationCount(ctx, taskId);
            }

            let targetLane: string;
            let ownerId: string;

            if (task.parentId) {
              // Route to the parent epic's task lane.
              targetLane = `task:${task.parentId}`;
              const parent = await ctx.services.tasks.getTask(
                ctx,
                task.parentId,
              );
              ownerId = parent?.agentId ?? task.assignerAgentId ?? task.agentId;
            } else {
              // Standalone / top-level task → main lane.
              targetLane = "main";
              ownerId = task.assignerAgentId ?? task.agentId;
            }

            await ctx.services.inbox.enqueueWork(ctx, ownerId, targetLane, {
              type: escalate ? "task_needs_attention" : "task_ready_for_review",
              payload: {
                taskId,
                title: task.title,
                comment: notes,
              },
            });
          }
        }

        const updated = await ctx.services.tasks.getTask(ctx, taskId);
        return toolOk(updated ?? { taskId });
      },
    ),
  });
}
