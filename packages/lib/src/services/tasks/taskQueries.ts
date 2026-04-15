import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { TaskCommentItem } from "../../resources/ddb/schema/taskComment.js";
import type { TaskDependencyItem } from "../../resources/ddb/schema/taskDependency.js";
import {
  getDependencies,
  getDependents,
} from "../../resources/ddb/taskDependency.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "./attachment.js";
import { getLatestComment } from "./taskComments.js";

// ── listTasks ───────────────────────────────────────────────────

export interface ListTasksFilters {
  status?: string;
  assignee?: string;
  priority?: number;
  parentId?: string;
}

export async function listTasks(
  ctx: ServiceContext,
  filters: ListTasksFilters = {},
): Promise<TaskItem[]> {
  let items: TaskItem[];

  // Pick the most efficient primary query based on available filters.
  if (filters.status) {
    items = await ctx.services.tasks.getTasksByStatus(ctx, filters.status);
  } else if (filters.parentId) {
    items = await ctx.services.tasks.getTasksByParent(ctx, filters.parentId);
  } else {
    // Fetch newest tasks first (last = backward from most recent)
    const connection = await ctx.services.tasks.getAllTasks(ctx, { last: 500 });
    items = connection.edges.map((e) => e.node);
  }

  // Apply remaining filters in-memory.
  return items.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.assignee && t.agentId !== filters.assignee) return false;
    if (filters.priority != null && t.priority !== filters.priority)
      return false;
    if (filters.parentId && t.parentId !== filters.parentId) return false;
    return true;
  });
}

// ── getChildren ─────────────────────────────────────────────────

export async function getChildren(
  ctx: ServiceContext,
  parentId: string,
): Promise<TaskItem[]> {
  return ctx.services.tasks.getTasksByParent(ctx, parentId);
}

// ── showTask ────────────────────────────────────────────────────

export interface TaskDetails {
  task: TaskItem;
  dependencies: TaskDependencyItem[];
  dependents: TaskDependencyItem[];
  children: TaskItem[];
  latestComment: TaskCommentItem | undefined;
  attachments: Attachment[];
  /** For epics: each child's attachments keyed by child task ID */
  childAttachments?: Record<string, Attachment[]>;
}

export async function showTask(
  ctx: ServiceContext,
  taskId: string,
): Promise<TaskDetails | null> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) return null;

  const table = ctx.resources.ddb.chatTable;

  const [dependencies, dependents, children, latestCommentResult, attachments] =
    await Promise.all([
      getDependencies(table, taskId),
      getDependents(table, taskId),
      ctx.services.tasks.getTasksByParent(ctx, taskId),
      getLatestComment(ctx, taskId),
      ctx.services.tasks.getTaskAttachments(ctx, taskId),
    ]);

  // For epics, also fetch each child's attachments
  let childAttachments: Record<string, Attachment[]> | undefined;
  if (children.length > 0) {
    const entries = await Promise.all(
      children.map(async (child) => {
        const atts = await ctx.services.tasks
          .getTaskAttachments(ctx, child.id)
          .catch(() => []);
        return [child.id, atts] as const;
      }),
    );
    childAttachments = Object.fromEntries(
      entries.filter(([, atts]) => atts.length > 0),
    );
    if (Object.keys(childAttachments).length === 0) {
      childAttachments = undefined;
    }
  }

  return {
    task,
    dependencies,
    dependents,
    children,
    latestComment: latestCommentResult,
    attachments,
    childAttachments,
  };
}
