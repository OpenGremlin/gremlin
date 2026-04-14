import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { TaskDependencyItem } from "../../resources/ddb/schema/taskDependency.js";
import {
  addDependency,
  getDependencies,
  getDependents,
  removeDependency,
} from "../../resources/ddb/taskDependency.js";
import type { ServiceContext } from "../context.js";

// ── addTaskDep ──────────────────────────────────────────────

export async function addTaskDep(
  ctx: ServiceContext,
  taskId: string,
  dependsOnId: string,
  depType?: string,
  createdBy?: string,
): Promise<TaskDependencyItem> {
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself");
  }

  // Cycle detection: BFS from dependsOnId — if we reach taskId, adding this
  // edge would create a cycle.
  const visited = new Set<string>();
  const queue = [dependsOnId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === taskId) {
      throw new Error(
        `Adding dependency would create a cycle: ${taskId} -> ${dependsOnId} -> ... -> ${taskId}`,
      );
    }
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = await getDependencies(ctx.resources.ddb.table, current);
    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        queue.push(dep.dependsOnId);
      }
    }
  }

  const item = await addDependency(ctx.resources.ddb.table, {
    taskId,
    dependsOnId,
    depType,
    createdBy: createdBy ?? "system",
  });

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (task) {
    ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, task);
  }

  return item;
}

// ── removeTaskDep ───────────────────────────────────────────

export async function removeTaskDep(
  ctx: ServiceContext,
  taskId: string,
  dependsOnId: string,
): Promise<void> {
  await removeDependency(ctx.resources.ddb.table, { taskId, dependsOnId });
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (task) {
    ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, task);
  }
}

// ── getTaskDepTree ──────────────────────────────────────────

export interface DepTreeNode {
  task: TaskItem;
  depth: number;
}

export async function getTaskDepTree(
  ctx: ServiceContext,
  taskId: string,
): Promise<DepTreeNode[]> {
  const result: DepTreeNode[] = [];
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [];

  // Seed with direct dependencies
  const directDeps = await getDependencies(ctx.resources.ddb.table, taskId);
  for (const dep of directDeps) {
    queue.push({ id: dep.dependsOnId, depth: 1 });
  }

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const task = await ctx.services.tasks.getTask(ctx, id);
    if (!task) continue;

    result.push({ task, depth });

    const deps = await getDependencies(ctx.resources.ddb.table, id);
    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        queue.push({ id: dep.dependsOnId, depth: depth + 1 });
      }
    }
  }

  return result;
}

// ── getBlockedTasks ─────────────────────────────────────────

export interface BlockedTasksFilter {
  parentId?: string;
  assignee?: string;
}

export async function getBlockedTasks(
  ctx: ServiceContext,
  filters?: BlockedTasksFilter,
): Promise<TaskItem[]> {
  let tasks: TaskItem[];

  if (filters?.parentId) {
    tasks = await ctx.services.tasks.getTasksByParent(ctx, filters.parentId);
  } else if (filters?.assignee) {
    tasks = await ctx.services.tasks.getTasksByAgent(ctx, filters.assignee);
  } else {
    // Get non-closed tasks via status queries
    const [open, inProgress, blocked] = await Promise.all([
      ctx.services.tasks.getTasksByStatus(ctx, "open"),
      ctx.services.tasks.getTasksByStatus(ctx, "in_progress"),
      ctx.services.tasks.getTasksByStatus(ctx, "blocked"),
    ]);
    tasks = [...open, ...inProgress, ...blocked];
  }

  // Apply cross-filters when primary query didn't cover both
  if (filters?.parentId && filters?.assignee) {
    tasks = tasks.filter((t) => t.agentId === filters.assignee);
  }

  // Filter to only non-closed tasks
  tasks = tasks.filter((t) => t.status !== "closed");

  const blocked: TaskItem[] = [];

  for (const task of tasks) {
    const deps = await getDependencies(ctx.resources.ddb.table, task.id);
    if (deps.length === 0) continue;

    // Check if any blocker is not yet closed
    for (const dep of deps) {
      const blocker = await ctx.services.tasks.getTask(ctx, dep.dependsOnId);
      if (blocker && blocker.status !== "closed") {
        blocked.push(task);
        break;
      }
    }
  }

  return blocked;
}

// ── getReadyWork ────────────────────────────────────────────

export interface ReadyWorkFilter {
  assignee?: string;
  parentId?: string;
  priority?: number;
}

export async function getReadyWork(
  ctx: ServiceContext,
  filters?: ReadyWorkFilter,
): Promise<TaskItem[]> {
  let tasks: TaskItem[];

  if (filters?.parentId) {
    tasks = await ctx.services.tasks.getTasksByParent(ctx, filters.parentId);
  } else if (filters?.assignee) {
    tasks = await ctx.services.tasks.getTasksByAgent(ctx, filters.assignee);
  } else {
    tasks = await ctx.services.tasks.getTasksByStatus(ctx, "open");
  }

  // Keep only open tasks — in_progress means already dispatched
  tasks = tasks.filter((t) => t.status === "open");

  // Apply filters
  if (filters?.parentId && filters?.assignee) {
    tasks = tasks.filter((t) => t.agentId === filters.assignee);
  }
  if (filters?.priority != null) {
    tasks = tasks.filter((t) => t.priority === filters.priority);
  }
  // Filter out deferred tasks
  const now = new Date().toISOString();
  tasks = tasks.filter((t) => !t.deferUntil || t.deferUntil <= now);

  // Filter out blocked tasks (those with at least one unclosed dependency)
  const ready: TaskItem[] = [];
  for (const task of tasks) {
    const deps = await getDependencies(ctx.resources.ddb.table, task.id);
    if (deps.length === 0) {
      ready.push(task);
      continue;
    }

    let isBlocked = false;
    for (const dep of deps) {
      const blocker = await ctx.services.tasks.getTask(ctx, dep.dependsOnId);
      if (blocker && blocker.status !== "closed") {
        isBlocked = true;
        break;
      }
    }
    if (!isBlocked) {
      ready.push(task);
    }
  }

  return ready;
}
