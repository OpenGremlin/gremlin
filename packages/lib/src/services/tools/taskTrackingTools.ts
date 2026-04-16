import { type Tool, tool } from "ai";
import { z } from "zod";

import type { ServiceContext } from "../context.js";

// ── Tool definitions ──────────────────────────────────────────────

/**
 * Build the first batch of native task-tracking tools.
 *
 * Native task-tracking tools backed by DynamoDB service
 * calls, giving LLM agents the ability to create, query, and manage
 * tasks natively.
 */
/**
 * Worker-safe tools for task lanes — no dependency management.
 */
export function buildTaskLaneTools(ctx: ServiceContext): Record<string, Tool> {
  return {
    taskCreate: tool({
      description:
        "Create a new task in the project tracker. The UI renders a rich card automatically — do NOT repeat the task structure or IDs in your text response.",
      inputSchema: z.object({
        title: z.string().describe("Brief title, 3-5 words"),
        instructions: z
          .string()
          .optional()
          .describe(
            "What to do. Must be self-contained when assigning to another agent (they can't see your conversation).",
          ),
        description: z
          .string()
          .optional()
          .describe(
            "Additional context or background. Use instructions for the actual assignment.",
          ),
        expectedInput: z
          .string()
          .nullable()
          .optional()
          .describe(
            "What data the assignee needs to start work. Describe what should be provided (e.g. 'list of file paths', 'customer error log'). Null means no specific input required.",
          ),
        expectedOutput: z
          .string()
          .nullable()
          .optional()
          .describe(
            "What the assignee should produce. Be specific: should it be a comment, an attachment, or both? What file format (markdown, JSON, CSV)? Example: 'attach a JSON file with {passed: number, failed: number} and add a summary comment'. Null means no specific output contract.",
          ),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("Priority 0 (critical) to 4 (backlog)"),
        assignee: z
          .string()
          .describe(
            "Agent ID to assign this task to. Required — every task must have an owner.",
          ),
        parentId: z
          .string()
          .optional()
          .describe("Parent task ID to nest under"),
        emoji: z.string().describe("A single emoji that best fits the task"),
        blockedBy: z
          .array(z.string())
          .optional()
          .describe("Task IDs that must complete before this task can start"),
      }),
      execute: async ({
        title,
        description,
        instructions,
        expectedInput,
        expectedOutput,
        priority,
        assignee,
        emoji,
        parentId,
        blockedBy,
      }) => {
        const task = await ctx.services.tasks.createTask(ctx, {
          agentId: assignee,
          title,
          description,
          instructions,
          expectedInput,
          expectedOutput,
          priority,
          parentId,
          emoji,
        });

        if (blockedBy && blockedBy.length > 0) {
          for (const depId of blockedBy) {
            await ctx.services.tasks.addTaskDep(ctx, task.id, depId);
          }
        }

        return task;
      },
    }),

    taskList: tool({
      description:
        "List tasks, optionally filtered by status, assignee, priority, or parent.",
      inputSchema: z.object({
        status: z
          .enum(["open", "in_progress", "done", "closed"])
          .optional()
          .describe("Filter by status"),
        assignee: z.string().optional().describe("Filter by assignee agent ID"),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("Filter by priority level"),
        parentId: z
          .string()
          .optional()
          .describe("Filter to children of a specific parent task"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Max results to return"),
      }),
      execute: async ({ status, assignee, priority, parentId, limit }) => {
        const tasks = await ctx.services.tasks.listTasks(ctx, {
          status,
          assignee,
          priority,
          parentId,
        });
        return tasks.slice(0, limit);
      },
    }),

    taskReady: tool({
      description:
        "List tasks ready to work on — unblocked, not deferred, and not closed. Use this to find the next actionable items.",
      inputSchema: z.object({
        assignee: z.string().optional().describe("Filter by assignee agent ID"),
        parentId: z
          .string()
          .optional()
          .describe("Filter to children of a specific parent task"),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("Filter by priority level"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Max results to return"),
      }),
      execute: async ({ assignee, parentId, priority, limit }) => {
        const tasks = await ctx.services.tasks.getReadyWork(ctx, {
          assignee,
          parentId,
          priority,
        });
        return tasks.slice(0, limit);
      },
    }),

    taskShow: tool({
      description:
        "Show full details of a single task including dependencies, children, and latest comment.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to look up"),
      }),
      execute: async ({ taskId }) => {
        const details = await ctx.services.tasks.showTask(ctx, taskId);
        if (!details) return { error: `Task ${taskId} not found` };
        return details;
      },
    }),

    taskUpdate: tool({
      description:
        "Update a task's status, fields, or escalate it.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to update"),
        status: z
          .enum(["open", "in_progress", "closed"])
          .optional()
          .describe(
            "New status. 'closed' = work complete. 'open' = reopen a closed task (e.g. to send work back for revision).",
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
            "A comment to add to the task's activity log. Required when closing or escalating.",
          ),
      }),
      execute: async ({
        taskId,
        status,
        escalate,
        priority,
        description,
        deferUntil,
        notes,
      }) => {
        if ((escalate || status === "closed") && !notes) {
          return {
            error: escalate
              ? "Escalating requires a notes comment explaining what's missing or wrong."
              : "Closing a task requires a notes comment summarizing what was produced.",
          };
        }

        // Redundant-close short-circuit: if the task is already closed, bail
        // before side effects to avoid duplicate comments and cascading
        // `task_ready_for_review` notifications to the parent epic.
        if (status === "closed") {
          const existing = await ctx.services.tasks.getTask(ctx, taskId);
          if (existing?.status === "closed") return existing;
        }

        if (status === "closed") {
          await ctx.services.tasks.closeTask(ctx, taskId, notes);
        } else if (status) {
          await ctx.services.tasks.updateTaskStatus(ctx, taskId, status);
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
              ownerId =
                parent?.agentId ?? task.assignerAgentId ?? task.agentId;
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
        return updated ?? { success: true, taskId };
      },
    }),
  };
}

/**
 * Full tool set for the main lane — includes dependency management tools
 * that workers don't need (deps are resolved automatically by the reconciler).
 */
export function buildTaskTrackingTools(
  ctx: ServiceContext,
): Record<string, Tool> {
  return {
    ...buildTaskLaneTools(ctx),

    taskDep: tool({
      description:
        "Add or remove a dependency between tasks. A dependency means taskId is blocked by dependsOnId.",
      inputSchema: z.object({
        taskId: z.string().describe("The task that is (or will be) blocked"),
        dependsOnId: z.string().describe("The task that must complete first"),
        action: z
          .enum(["add", "remove"])
          .describe("Whether to add or remove the dependency"),
      }),
      execute: async ({ taskId, dependsOnId, action }) => {
        if (action === "add") {
          const dep = await ctx.services.tasks.addTaskDep(
            ctx,
            taskId,
            dependsOnId,
          );
          return { success: true, dependency: dep };
        }
        await ctx.services.tasks.removeTaskDep(ctx, taskId, dependsOnId);
        return { success: true, removed: { taskId, dependsOnId } };
      },
    }),

    taskDepTree: tool({
      description:
        "Show the full transitive dependency tree for a task — all tasks it depends on, recursively.",
      inputSchema: z.object({
        taskId: z
          .string()
          .describe("The task ID to show the dependency tree for"),
      }),
      execute: async ({ taskId }) => {
        const tree = await ctx.services.tasks.getTaskDepTree(ctx, taskId);
        return { taskId, dependencies: tree };
      },
    }),

    taskBlocked: tool({
      description:
        "List tasks that are blocked — they have at least one dependency that is not yet closed.",
      inputSchema: z.object({
        parentId: z
          .string()
          .optional()
          .describe("Filter to children of a specific parent task"),
        assignee: z.string().optional().describe("Filter by assignee agent ID"),
      }),
      execute: async ({ parentId, assignee }) => {
        const tasks = await ctx.services.tasks.getBlockedTasks(ctx, {
          parentId,
          assignee,
        });
        return tasks;
      },
    }),
  };
}
