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
export function buildTaskLaneTools(
  ctx: ServiceContext,
): Record<string, Tool> {
  return {
    taskCreate: tool({
      description:
        "Create a new task in the project tracker. The UI renders a rich card automatically — do NOT repeat the task structure or IDs in your text response.",
      inputSchema: z.object({
        title: z.string().describe("Brief title, 3-5 words"),
        description: z
          .string()
          .optional()
          .describe("Longer description of what needs to be done"),
        issueType: z
          .enum(["task", "epic", "bug", "feature"])
          .default("task")
          .describe("Issue type"),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("Priority 0 (critical) to 4 (backlog)"),
        assignee: z
          .string()
          .optional()
          .describe("Agent ID to assign this task to"),
        parentId: z
          .string()
          .optional()
          .describe("Parent task ID (e.g. an epic) to nest under"),
        emoji: z
          .string()
          .describe("A single emoji that best fits the task"),
        blockedBy: z
          .array(z.string())
          .optional()
          .describe(
            "Task IDs that must complete before this task can start",
          ),
      }),
      execute: async ({
        title,
        description,
        issueType,
        priority,
        assignee,
        emoji,
        parentId,
        blockedBy,
      }) => {
        const task = await ctx.services.tasks.createTask(ctx, {
          agentId: assignee ?? "",
          title,
          description,
          issueType,
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
        "List tasks, optionally filtered by status, type, assignee, priority, or parent.",
      inputSchema: z.object({
        status: z
          .enum(["open", "in_progress", "blocked", "closed"])
          .optional()
          .describe("Filter by status"),
        issueType: z
          .enum(["task", "epic", "bug", "feature"])
          .optional()
          .describe("Filter by issue type"),
        assignee: z
          .string()
          .optional()
          .describe("Filter by assignee agent ID"),
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
      execute: async ({ status, issueType, assignee, priority, parentId, limit }) => {
        const tasks = await ctx.services.tasks.listTasks(ctx, {
          status,
          issueType,
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
        assignee: z
          .string()
          .optional()
          .describe("Filter by assignee agent ID"),
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
        issueType: z
          .enum(["task", "epic", "bug", "feature"])
          .optional()
          .describe("Filter by issue type"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Max results to return"),
      }),
      execute: async ({ assignee, parentId, priority, issueType, limit }) => {
        const tasks = await ctx.services.tasks.getReadyWork(ctx, {
          assignee,
          parentId,
          priority,
          issueType,
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
        "Update fields on an existing task. To close a task, use taskClose instead. Note: you cannot set status to 'closed' here — use taskClose, which enforces that all children must be closed first for epics.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to update"),
        status: z
          .enum(["open", "in_progress", "blocked"])
          .optional()
          .describe(
            "New status. To close a task use taskClose instead.",
          ),
        assignee: z
          .string()
          .optional()
          .describe("New assignee agent ID"),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("New priority 0 (critical) to 4 (backlog)"),
        description: z
          .string()
          .optional()
          .describe("Updated description"),
        deferUntil: z
          .string()
          .optional()
          .describe(
            "ISO 8601 date — task won't appear in ready queue until this date",
          ),
        notes: z
          .string()
          .optional()
          .describe("A comment to add to the task's activity log"),
      }),
      execute: async ({
        taskId,
        status,
        assignee,
        priority,
        description,
        deferUntil,
        notes,
      }) => {
        if (status) {
          await ctx.services.tasks.updateTaskStatus(ctx, taskId, status);
        }

        const hasFieldUpdates =
          assignee != null ||
          priority != null ||
          description != null ||
          deferUntil != null;

        if (hasFieldUpdates) {
          await ctx.services.tasks.updateTaskFields(ctx, taskId, {
            assignee,
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

        const updated = await ctx.services.tasks.getTask(ctx, taskId);
        return updated ?? { success: true, taskId };
      },
    }),

    taskClose: tool({
      description:
        "Mark a task as complete/closed. Use this instead of taskUpdate for closing tasks. IMPORTANT: An epic (parent task) cannot be closed until ALL of its child tasks are closed first — close children before closing the epic.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to close"),
        reason: z
          .string()
          .optional()
          .describe("Why the task was closed (e.g. 'done', 'duplicate', 'wontfix')"),
      }),
      execute: async ({ taskId, reason }) => {
        const task = await ctx.services.tasks.closeTask(ctx, taskId, reason);
        return task;
      },
    }),

    taskReopen: tool({
      description:
        "Reopen a previously closed task, returning it to open status.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to reopen"),
      }),
      execute: async ({ taskId }) => {
        const task = await ctx.services.tasks.reopenTask(ctx, taskId);
        return task;
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
        taskId: z
          .string()
          .describe("The task that is (or will be) blocked"),
        dependsOnId: z
          .string()
          .describe("The task that must complete first"),
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
        taskId: z.string().describe("The task ID to show the dependency tree for"),
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
        assignee: z
          .string()
          .optional()
          .describe("Filter by assignee agent ID"),
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
