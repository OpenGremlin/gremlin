import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

/** Max escalations before we stop dispatching and surface to the user. */
const MAX_ESCALATIONS = 3;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Map the special `"self"` assignee to the triggering agent's ID.
 * All other values pass through as literal agent IDs.
 */
function resolveAssignee(assignee: string, triggerAgentId: string): string {
  return assignee === "self" ? triggerAgentId : assignee;
}

/**
 * Determine which agent should receive assignment notifications for a
 * set of unassigned tasks. Looks up the parent (epic) of the first
 * task that has one and returns its agentId. Falls back to
 * triggerAgentId when no epic owner can be inferred.
 */
async function findEpicOwner(
  ctx: ServiceContext,
  tasks: TaskItem[],
  triggerAgentId: string,
): Promise<string> {
  for (const t of tasks) {
    if (t.parentId) {
      const parent = await ctx.services.tasks.getTask(ctx, t.parentId);
      if (parent?.agentId && parent.agentId !== "unassigned") {
        return parent.agentId;
      }
    }
  }
  return triggerAgentId;
}

// ── Reconciler ──────────────────────────────────────────────────────

/**
 * Deterministic reconciler that bridges native tasks with the inbox/SQS
 * delivery system. Call as a tail-call after any lane that touches
 * tasks — it queries ready work and dispatches through the inbox
 * without an LLM turn.
 *
 * @param ctx              Service context (provides inbox, agents, logger)
 * @param triggerAgentId   Agent whose lane just finished (used to resolve "self")
 */
export async function reconcile(
  ctx: ServiceContext,
  triggerAgentId: string,
): Promise<void> {
  const ready = await ctx.services.tasks.getReadyWork(ctx);
  const needsAssignment: TaskItem[] = [];

  for (const task of ready) {
    // Circuit breaker: if a task has been escalated too many times,
    // close it and notify the assigner (or epic owner).
    if ((task.escalationCount ?? 0) >= MAX_ESCALATIONS) {
      await ctx.services.tasks.closeTask(ctx, task.id, "escalation_limit");

      const ownerId =
        task.assignerAgentId ??
        (task.parentId
          ? (await ctx.services.tasks.getTask(ctx, task.parentId))?.agentId
          : null) ??
        triggerAgentId;

      const escalationLane = task.parentId ? `task:${task.parentId}` : "main";
      await ctx.services.inbox.enqueueWork(ctx, ownerId, escalationLane, {
        type: "task_needs_attention",
        payload: {
          taskId: task.id,
          title: task.title,
          comment: `This task was escalated ${task.escalationCount} times and has been closed. Review it manually or create a new task.`,
        },
      });

      ctx.log.warn(
        {
          taskId: task.id,
          escalationCount: task.escalationCount,
          component: "reconciler",
        },
        "Task exceeded max escalations — closed and notified owner",
      );
      continue;
    }

    const assignee = task.agentId;

    if (!assignee || assignee === "unassigned") {
      needsAssignment.push(task);
      continue;
    }

    const targetAgentId = resolveAssignee(assignee, triggerAgentId);

    // Validate that the assignee is a real agent. If not, treat as
    // unassigned so the manager can re-route.
    try {
      const agent = await ctx.services.agents.getAgent(ctx, targetAgentId);
      if (!agent) {
        ctx.log.warn(
          { taskId: task.id, assignee: targetAgentId, component: "reconciler" },
          "Task assignee is not a valid agent; treating as unassigned",
        );
        needsAssignment.push(task);
        continue;
      }
    } catch (err) {
      ctx.log.warn(
        {
          err,
          taskId: task.id,
          assignee: targetAgentId,
          component: "reconciler",
        },
        "Failed to validate task assignee; skipping task",
      );
      continue;
    }

    // A task with escalationCount > 0 has been dispatched before (was
    // blocked or rejected and is now open again). Resume the existing
    // task lane with a nudge instead of starting a fresh lane.
    if ((task.escalationCount ?? 0) > 0) {
      await ctx.services.tasks.updateTaskStatus(ctx, task.id, "in_progress");
      await ctx.services.orchestrator.writeAgentLog(ctx, {
        agentId: targetAgentId,
        taskId: task.id,
        role: "SYSTEM",
        content:
          "This task has new updates from the assigner. Check the latest comments and attachments, then continue your work.",
      });

      await ctx.services.inbox.enqueueWork(
        ctx,
        targetAgentId,
        `task:${task.id}`,
        {
          type: "resume_task",
          payload: { taskId: task.id },
        },
      );

      ctx.log.info(
        { taskId: task.id, targetAgentId, component: "reconciler" },
        "Resumed task lane after unblock",
      );
    } else {
      // Resolve "self" assignee before handing off.
      const taskForDispatch =
        targetAgentId === task.agentId
          ? task
          : { ...task, agentId: targetAgentId };
      await ctx.services.orchestrator.dispatchTask(ctx, taskForDispatch);

      ctx.log.info(
        {
          taskId: task.id,
          targetAgentId,
          component: "reconciler",
        },
        "Dispatched task to task lane",
      );
    }
  }

  // Wake the epic owner (or trigger agent) for any ready tasks that have
  // no assignee. Route to the parent's task lane when the unassigned
  // tasks belong to an epic, otherwise to the main lane.
  if (needsAssignment.length > 0) {
    const byParent = new Map<string | undefined, TaskItem[]>();
    for (const t of needsAssignment) {
      const key = t.parentId ?? undefined;
      const group = byParent.get(key) ?? [];
      group.push(t);
      byParent.set(key, group);
    }

    for (const [parentId, tasks] of byParent) {
      const lane = parentId ? `task:${parentId}` : "main";
      const ownerId = await findEpicOwner(ctx, tasks, triggerAgentId);
      await ctx.services.inbox.enqueueWork(ctx, ownerId, lane, {
        type: "tasks_need_assignment",
        payload: { taskIds: tasks.map((t) => t.id) },
      });
    }

    ctx.log.info(
      { count: needsAssignment.length, component: "reconciler" },
      "Enqueued tasks_need_assignment to manager(s)",
    );
  }
}
