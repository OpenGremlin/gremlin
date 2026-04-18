import type { Tool } from "ai";
import type { ServiceContext } from "../../context.js";
import { taskBlocked } from "./taskBlocked.js";
import { taskCreate } from "./taskCreate.js";
import { taskDep } from "./taskDep.js";
import { taskDepTree } from "./taskDepTree.js";
import { taskList } from "./taskList.js";
import { taskReady } from "./taskReady.js";
import { taskShow } from "./taskShow.js";
import { taskUpdate } from "./taskUpdate.js";

/**
 * Worker-safe tools for task lanes — no dependency management.
 * Native task-tracking tools backed by DynamoDB service calls, giving
 * LLM agents the ability to create, query, and manage tasks natively.
 *
 * @param currentTaskId  When set, `taskCreate` auto-parents new tasks to
 *                       this task. Pass the caller's taskId inside a task
 *                       lane so agents can only grow their own subtree.
 */
export function buildTaskLaneTools(
  ctx: ServiceContext,
  currentTaskId?: string,
): Record<string, Tool> {
  return {
    taskCreate: taskCreate(ctx, currentTaskId),
    taskList: taskList(ctx),
    taskReady: taskReady(ctx),
    taskShow: taskShow(ctx),
    taskUpdate: taskUpdate(ctx),
  };
}

/**
 * Full tool set for the main lane — includes dependency management tools
 * that workers don't need (deps are resolved automatically by the reconciler).
 * No `currentTaskId` means tasks created here are top-level.
 */
export function buildTaskTrackingTools(
  ctx: ServiceContext,
): Record<string, Tool> {
  return {
    ...buildTaskLaneTools(ctx),
    taskDep: taskDep(ctx),
    taskDepTree: taskDepTree(ctx),
    taskBlocked: taskBlocked(ctx),
  };
}
