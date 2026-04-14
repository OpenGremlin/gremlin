import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import type { EnqueueInput } from "../inbox/enqueueWork.js";

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Map the special `"self"` assignee to the triggering agent's ID.
 * All other values pass through as literal agent IDs.
 */
function resolveAssignee(assignee: string, triggerAgentId: string): string {
  return assignee === "self" ? triggerAgentId : assignee;
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
    const assignee = task.agentId;

    if (!assignee || assignee === "unassigned") {
      needsAssignment.push(task);
      continue;
    }

    const targetAgentId = resolveAssignee(assignee, triggerAgentId);
    const isSelfAssigned = targetAgentId === triggerAgentId;

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

    await ctx.services.tasks.updateTaskStatus(ctx, task.id, "in_progress");

    await ctx.services.inbox.enqueueWork(
      ctx,
      targetAgentId,
      `task:${task.id}`,
      {
        type: "run_task",
        payload: {
          taskId: task.id,
          prompt: task.description ?? task.brief ?? task.title,
          inheritContext: isSelfAssigned,
        },
      },
    );

    ctx.log.info(
      {
        taskId: task.id,
        targetAgentId,
        isSelfAssigned,
        component: "reconciler",
      },
      "Dispatched task to task lane",
    );
  }

  // Wake the manager for any ready tasks that have no assignee.
  if (needsAssignment.length > 0) {
    const input: EnqueueInput = {
      type: "tasks_need_assignment",
      payload: { taskIds: needsAssignment.map((t) => t.id) },
    };
    await ctx.services.inbox.enqueueWork(ctx, triggerAgentId, "main", input);

    ctx.log.info(
      { count: needsAssignment.length, component: "reconciler" },
      "Enqueued tasks_need_assignment to manager",
    );
  }

  await closeCompletedEpics(ctx, triggerAgentId);
}

// ── Epic closure ────────────────────────────────────────────────────

/**
 * Auto-close epics whose children are all closed, and notify the
 * triggering agent so it can deliver results to the user.
 */
export async function closeCompletedEpics(
  ctx: ServiceContext,
  triggerAgentId: string,
): Promise<void> {
  const openEpics = await ctx.services.tasks.listTasks(ctx, {
    issueType: "epic",
    status: "open",
  });

  for (const epic of openEpics) {
    const children = await ctx.services.tasks.getChildren(ctx, epic.id);

    // Skip epics with no children or with any non-closed child.
    if (children.length === 0) continue;
    const allClosed = children.every((c) => c.status === "closed");
    if (!allClosed) continue;

    await ctx.services.tasks.closeTask(ctx, epic.id, "All children completed");

    const epicInput: EnqueueInput = {
      type: "epic_complete",
      payload: { taskId: epic.id, title: epic.title },
    };
    await ctx.services.inbox.enqueueWork(
      ctx,
      triggerAgentId,
      "main",
      epicInput,
    );

    ctx.log.info(
      { epicId: epic.id, component: "reconciler" },
      "Auto-closed completed epic and notified manager",
    );
  }
}
