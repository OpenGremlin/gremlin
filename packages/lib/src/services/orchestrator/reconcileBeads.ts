import type { ServiceContext } from "../context.js";
import type { EnqueueInput } from "../inbox/enqueueWork.js";
import { createTask } from "../tasks/createTask.js";
import { updateTaskMessage } from "../tasks/updateTaskMessage.js";

// ── BeadsClient interface ───────────────────────────────────────────
//
// Thin wrapper around the beads MCP tool calls. The concrete
// implementation lives in the MCP integration layer; the reconciler
// only depends on this interface so it stays testable without MCP.

export interface BeadSummary {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  parentId?: string;
  type?: string;
  /** Whether all children are closed and the epic can be closed. */
  epic_closeable?: boolean;
}

export interface BeadsClient {
  /** Return beads whose dependencies are satisfied and are ready to run. */
  readyWork(): Promise<BeadSummary[]>;
  /** Update fields on a bead (status, notes, etc.). */
  updateIssue(params: {
    issue_id: string;
    status?: string;
    notes?: string;
  }): Promise<void>;
  /** Fetch a single bead by ID. */
  showIssue(params: { issue_id: string }): Promise<BeadSummary>;
  /** Close a bead with an optional reason. */
  closeIssue(params: { issue_id: string; reason?: string }): Promise<void>;
  /** List beads, optionally filtered by status, type, or assignee. */
  listIssues(params?: {
    status?: string;
    type?: string;
    assignee?: string;
  }): Promise<BeadSummary[]>;
  /** Fetch comments for a bead. */
  getComments(params: {
    issue_id: string;
  }): Promise<Array<{ id: string; text: string; created_at: string }>>;
  /** Fetch child beads one level deep. */
  getChildren(params: { issue_id: string }): Promise<BeadSummary[]>;
}

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
 * Deterministic reconciler that bridges beads with the inbox/SQS
 * delivery system. Call as a tail-call after any lane that touches
 * beads — it queries ready work and dispatches through the inbox
 * without an LLM turn.
 *
 * @param ctx      Service context (provides inbox, agents, logger)
 * @param beads    BeadsClient for the current workspace
 * @param workspaceId  Workspace owning the beads
 * @param triggerAgentId  Agent whose lane just finished (used to resolve "self")
 */
export async function reconcile(
  ctx: ServiceContext,
  beads: BeadsClient,
  _workspaceId: string,
  triggerAgentId: string,
): Promise<void> {
  const ready = await beads.readyWork();
  const needsAssignment: BeadSummary[] = [];

  for (const bead of ready) {
    if (!bead.assignee) {
      needsAssignment.push(bead);
      continue;
    }

    const targetAgentId = resolveAssignee(bead.assignee, triggerAgentId);
    const isSelfAssigned = targetAgentId === triggerAgentId;

    // Validate that the assignee is a real agent. If not, treat as
    // unassigned so the manager can re-route.
    try {
      const agent = await ctx.services.agents.getAgent(ctx, targetAgentId);
      if (!agent) {
        ctx.log.warn(
          { beadId: bead.id, assignee: targetAgentId, component: "reconciler" },
          "Bead assignee is not a valid agent; treating as unassigned",
        );
        needsAssignment.push(bead);
        continue;
      }
    } catch (err) {
      ctx.log.warn(
        {
          err,
          beadId: bead.id,
          assignee: targetAgentId,
          component: "reconciler",
        },
        "Failed to validate bead assignee; skipping bead",
      );
      continue;
    }

    await beads.updateIssue({ issue_id: bead.id, status: "in_progress" });

    ctx.resources.pubsub.publish(`beadUpdated:${bead.id}`, {
      id: bead.id,
      title: bead.title,
      status: "in_progress",
      assignee: targetAgentId,
      parent_id: bead.parentId,
    });

    await ctx.services.inbox.enqueueWork(
      ctx,
      targetAgentId,
      `task:${bead.id}`,
      {
        type: "run_task",
        payload: {
          beadId: bead.id,
          prompt: bead.description,
          inheritContext: isSelfAssigned,
        },
      },
    );

    // ── Phase 1 migration: Task projection ─────────────────────────
    // Write a Task DDB row so the existing mobile UI (useTaskInfo,
    // TaskCard, GraphQL subscriptions) continues to work while
    // BeadCard is being built. Remove once Phase 3 is complete.
    await createTask(ctx, {
      agentId: targetAgentId,
      title: bead.title,
      assignerAgentId: triggerAgentId,
      brief: bead.description,
    }).then(
      (task) =>
        ctx.log.info(
          { beadId: bead.id, taskId: task.id, component: "reconciler" },
          "Created Task projection for bead",
        ),
      (err) =>
        ctx.log.warn(
          { err, beadId: bead.id, component: "reconciler" },
          "Task projection create failed (non-fatal)",
        ),
    );

    ctx.log.info(
      {
        beadId: bead.id,
        targetAgentId,
        isSelfAssigned,
        component: "reconciler",
      },
      "Dispatched bead to task lane",
    );
  }

  // Wake the manager for any ready beads that have no assignee.
  if (needsAssignment.length > 0) {
    const input: EnqueueInput = {
      type: "beads_need_assignment",
      payload: { beadIds: needsAssignment.map((b) => b.id) },
    };
    await ctx.services.inbox.enqueueWork(ctx, triggerAgentId, "main", input);

    ctx.log.info(
      { count: needsAssignment.length, component: "reconciler" },
      "Enqueued beads_need_assignment to manager",
    );
  }

  await closeCompletedEpics(ctx, beads, triggerAgentId);
}

// ── Epic closure ────────────────────────────────────────────────────

/**
 * Auto-close epics whose children are all closed, and notify the
 * triggering agent so it can deliver results to the user.
 *
 * @param ctx      Service context
 * @param beads    BeadsClient for the current workspace
 * @param triggerAgentId  Agent to notify on epic completion
 */
export async function closeCompletedEpics(
  ctx: ServiceContext,
  beads: BeadsClient,
  triggerAgentId: string,
): Promise<void> {
  const openEpics = await beads.listIssues({ type: "epic", status: "open" });

  for (const epic of openEpics) {
    // Fetch full epic to check the epic_closeable flag set by beads
    // when all children are in a terminal state.
    const full = await beads.showIssue({ issue_id: epic.id });
    if (!full.epic_closeable) continue;

    await beads.closeIssue({
      issue_id: epic.id,
      reason: "All children completed",
    });

    ctx.resources.pubsub.publish(`beadUpdated:${epic.id}`, {
      id: epic.id,
      title: epic.title,
      status: "closed",
      assignee: epic.assignee,
      parent_id: epic.parentId,
    });

    const epicInput: EnqueueInput = {
      type: "epic_complete",
      payload: { beadId: epic.id, title: epic.title },
    };
    await ctx.services.inbox.enqueueWork(
      ctx,
      triggerAgentId,
      "main",
      epicInput,
    );

    // ── Phase 1 migration: mark matching Tasks as complete ────────
    // Best-effort: find tasks assigned to the trigger agent whose
    // title matches the epic and set a completion message so the
    // mobile UI reflects the finished state. Remove once Phase 3
    // is complete.
    try {
      const agentTasks = await ctx.services.tasks.getTasksByAgent(
        ctx,
        triggerAgentId,
      );
      const matching = agentTasks.filter((t) => t.title === epic.title);
      for (const task of matching) {
        await updateTaskMessage(
          ctx,
          task.id,
          `Completed: ${epic.title} — All children completed`,
        ).catch((err) =>
          ctx.log.warn(
            { err, taskId: task.id, epicId: epic.id, component: "reconciler" },
            "Task projection update failed (non-fatal)",
          ),
        );
      }
    } catch (err) {
      ctx.log.warn(
        { err, epicId: epic.id, component: "reconciler" },
        "Task projection lookup for epic failed (non-fatal)",
      );
    }

    ctx.log.info(
      { epicId: epic.id, component: "reconciler" },
      "Auto-closed completed epic and notified manager",
    );
  }
}
