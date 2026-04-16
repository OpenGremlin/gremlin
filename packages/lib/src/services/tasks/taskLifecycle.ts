import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

/**
 * Notify the parent task's subscribers by fetching the parent's current data.
 * This ensures the parent TaskCard receives the parent's own TaskItem — not the
 * child's — preventing the UI from flashing between epic and child views.
 */
async function notifyParent(
  ctx: ServiceContext,
  parentId: string,
): Promise<void> {
  const parent = await ctx.services.tasks.getTask(ctx, parentId);
  if (parent) {
    ctx.resources.pubsub.publish(`taskUpdated:${parentId}`, parent);
  }
}

const VALID_STATUSES = ["open", "in_progress", "done", "closed"] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

function assertValidStatus(status: string): asserts status is TaskStatus {
  if (!VALID_STATUSES.includes(status as TaskStatus)) {
    throw new Error(
      `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }
}

/**
 * Check that all children of a task are closed before allowing it to close.
 * Returns an error message if any children are still open, or null if OK.
 */
async function checkChildrenClosed(
  ctx: ServiceContext,
  task: TaskItem,
): Promise<string | null> {
  const children = await ctx.services.tasks.getChildren(ctx, task.id);
  if (children.length === 0) return null;
  const openChildren = children.filter((c) => c.status !== "closed");
  if (openChildren.length === 0) return null;
  const openList = openChildren
    .map((c) => `  - ${c.id}: "${c.title}" (${c.status})`)
    .join("\n");
  return (
    `Cannot close "${task.title}" (${task.id}) because ${openChildren.length} ` +
    `child task(s) are still open:\n${openList}\n\n` +
    `Close all child tasks first, then close the parent.`
  );
}

/**
 * Update a task's status and its GSI4 index key.
 * Publishes `taskUpdated:${taskId}` (and `taskUpdated:${parentId}` if the
 * task has a parent) so subscribers can react to status changes.
 */
export async function updateTaskStatus(
  ctx: ServiceContext,
  taskId: string,
  status: string,
): Promise<TaskItem> {
  assertValidStatus(status);

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  if (status === "closed") {
    const err = await checkChildrenClosed(ctx, task);
    if (err) throw new Error(err);
  }

  const now = new Date().toISOString();
  const isClosing = status === "closed";
  // Rejection: assigner sends completed work back (done → open)
  const isRejection = status === "open" && task.status === "done";

  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `TASK#${taskId}`, sk: "TASK" },
      UpdateExpression:
        "SET #status = :status, updatedAt = :now, gsi4pk = :gsi4pk, gsi4sk = :gsi4sk" +
        (isClosing ? ", closedAt = :closedAt" : ""),
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":now": now,
        ":gsi4pk": `TASK_STATUS#${status}`,
        ":gsi4sk": `${task.createdAt}#${taskId}`,
        ...(isClosing ? { ":closedAt": now } : {}),
      },
    }),
  );

  // Increment escalation count on rejection (done → open)
  if (isRejection) {
    await incrementEscalationCount(ctx, taskId);
  }

  const prevEscalation = task.escalationCount ?? 0;
  const updated: TaskItem = {
    ...task,
    status,
    updatedAt: now,
    ...(isClosing ? { closedAt: now } : {}),
    ...(isRejection ? { escalationCount: prevEscalation + 1 } : {}),
  };

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, updated);
  if (task.parentId) {
    await notifyParent(ctx, task.parentId);
  }

  return updated;
}

/**
 * Close a task, optionally recording a reason.
 */
export async function closeTask(
  ctx: ServiceContext,
  taskId: string,
  reason?: string,
): Promise<TaskItem> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  // Idempotent: closing an already-closed task is a no-op. Prevents duplicate
  // pubsub emissions and parent "task_ready_for_review" cascades when an
  // orchestrator redundantly re-closes a child.
  if (task.status === "closed") return task;

  const err = await checkChildrenClosed(ctx, task);
  if (err) throw new Error(err);

  const now = new Date().toISOString();

  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `TASK#${taskId}`, sk: "TASK" },
      UpdateExpression:
        "SET #status = :status, updatedAt = :now, closedAt = :closedAt, gsi4pk = :gsi4pk, gsi4sk = :gsi4sk" +
        (reason ? ", closeReason = :closeReason" : ""),
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "closed",
        ":now": now,
        ":closedAt": now,
        ":gsi4pk": "TASK_STATUS#closed",
        ":gsi4sk": `${task.createdAt}#${taskId}`,
        ...(reason ? { ":closeReason": reason } : {}),
      },
    }),
  );

  const updated: TaskItem = {
    ...task,
    status: "closed",
    updatedAt: now,
    closedAt: now,
    ...(reason ? { closeReason: reason } : {}),
  };

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, updated);
  if (task.parentId) {
    await notifyParent(ctx, task.parentId);
  }

  return updated;
}

/**
 * Reopen a closed task — sets status back to "open" and clears
 * closedAt / closeReason.
 */
export async function reopenTask(
  ctx: ServiceContext,
  taskId: string,
): Promise<TaskItem> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const now = new Date().toISOString();

  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `TASK#${taskId}`, sk: "TASK" },
      UpdateExpression:
        "SET #status = :status, updatedAt = :now, gsi4pk = :gsi4pk, gsi4sk = :gsi4sk REMOVE closedAt, closeReason",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "open",
        ":now": now,
        ":gsi4pk": "TASK_STATUS#open",
        ":gsi4sk": `${task.createdAt}#${taskId}`,
      },
    }),
  );

  const { closedAt, closeReason, ...rest } = task;
  const updated: TaskItem = {
    ...rest,
    status: "open",
    updatedAt: now,
  };

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, updated);
  if (task.parentId) {
    await notifyParent(ctx, task.parentId);
  }

  return updated;
}

/**
 * Atomically increment the escalation counter on a task.
 * Called when a worker escalates or an assigner rejects.
 */
export async function incrementEscalationCount(
  ctx: ServiceContext,
  taskId: string,
): Promise<void> {
  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `TASK#${taskId}`, sk: "TASK" },
      UpdateExpression:
        "SET escalationCount = if_not_exists(escalationCount, :zero) + :one",
      ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
    }),
  );
}

/**
 * Update mutable task fields (priority, description, deferUntil).
 * Assignment is immutable — agentId cannot be changed after creation.
 * Only provided fields are written.
 */
export async function updateTaskFields(
  ctx: ServiceContext,
  taskId: string,
  fields: {
    priority?: number;
    description?: string;
    deferUntil?: string;
  },
): Promise<TaskItem> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const now = new Date().toISOString();

  const setParts: string[] = ["updatedAt = :now"];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":now": now };

  if (fields.priority != null) {
    setParts.push("priority = :priority");
    values[":priority"] = fields.priority;
  }
  if (fields.description != null) {
    // "description" is not a reserved word but we alias for safety
    setParts.push("#desc = :desc");
    names["#desc"] = "description";
    values[":desc"] = fields.description;
  }
  if (fields.deferUntil != null) {
    setParts.push("deferUntil = :deferUntil");
    values[":deferUntil"] = fields.deferUntil;
  }
  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `TASK#${taskId}`, sk: "TASK" },
      UpdateExpression: `SET ${setParts.join(", ")}`,
      ...(Object.keys(names).length > 0
        ? { ExpressionAttributeNames: names }
        : {}),
      ExpressionAttributeValues: values,
    }),
  );

  const updated: TaskItem = {
    ...task,
    updatedAt: now,
    ...(fields.priority != null ? { priority: fields.priority } : {}),
    ...(fields.description != null ? { description: fields.description } : {}),
    ...(fields.deferUntil != null ? { deferUntil: fields.deferUntil } : {}),
  };

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, updated);
  if (task.parentId) {
    await notifyParent(ctx, task.parentId);
  }

  return updated;
}
