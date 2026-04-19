# Task Flow

How a task travels from creation to completion in Gremlin. This doc is the
authoritative reference for status transitions, dispatch, and coordination —
verified against the code at the time of writing.

## Mental model

```
main lane ──creates──▶ top-level task ──dispatched──▶ task lane
                              │                            │
                              │                    ┌───────┴───────┐
                              │                    │               │
                              │                  works            spawns
                              │                  on it           subtasks
                              │                    │               │
                              └──close notifies ◀──┴────── ◀───────┘
                                    parent/assigner
```

- **Main lane** is an agent's main chat. No current task.
- **Task lane** is a dedicated sub-thread for one task. All work for that task
  (tool calls, attachments, subtasks) happens here.
- An agent can only grow **its own** task subtree — `taskCreate` auto-parents
  to the current task when called from a task lane (see
  `packages/lib/src/services/tools/taskTracking/taskCreate.ts:11,82`).

## Status vocabulary

Three values, defined at `packages/lib/src/services/tasks/taskLifecycle.ts:21`.
The GraphQL enum (`typeDefs.ts`) and the agent `taskUpdate` tool schema
(`taskUpdate.ts:12`) use the same three values — one vocabulary end to end.

| Status        | Who sets it                                        | Meaning                                                  |
| ------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `open`        | `createTask` default; rejection (`closed`→`open`)  | Ready to dispatch if unblocked and not deferred.         |
| `in_progress` | Reconciler when dispatching                        | Assigned to a lane; agent is (or will be) working on it. |
| `closed`      | `closeTask` (agent tool or service)                | Terminal. Can be reopened by assigner for rejection.     |

## Creation

**Entry point:** `taskCreate` tool
(`packages/lib/src/services/tools/taskTracking/taskCreate.ts`).

`taskCreate(ctx, currentTaskId?)` is bound differently per lane:

- **Main lane** (`runMainLane.ts:72` → `buildTaskTrackingTools`) — no
  `currentTaskId` → new tasks are **top-level**.
- **Task lane** (`buildTaskTools/index.ts:51` → `buildTaskLaneTools(ctx, taskId)`) —
  `currentTaskId` is set → new tasks are **children of the current task**.

There is no `parentId` field in the tool schema. Hierarchy is determined by
lane context, which structurally enforces "only a parent creates its own
children."

The service layer (`packages/lib/src/services/tasks/createTask.ts`) then:

1. **Rejects unassigned work** (`createTask.ts:46-53`) — `agentId` is required
   and immutable at creation.
2. **Validates parent** (`createTask.ts:58-68`) — parent must exist and be
   assigned, so completion notifications always have a recipient.
3. **Enforces max nesting depth** (`createTask.ts:70-86`, `MAX_TASK_DEPTH = 3`) —
   prevents runaway hierarchies.
4. **Writes the item** with status `open` and GSI keys for querying by agent,
   parent, status, and creation time (`createTask.ts:90,92-145`).
5. **Records blocking deps**: the tool loops `blockedBy` and calls `addTaskDep`
   (`taskCreate.ts:86-89`), which also runs cycle detection
   (`taskDeps.ts:24-43`).

After creation, the tool either **dispatches the task immediately** (no
blockers) via `orchestrator.dispatchTask`, or leaves it in `open` for the
reconciler to pick up (when `blockedBy` is non-empty). Immediate dispatch
closes the race where a parent could close a child mid-turn before the next
reconciler pass.

## Dispatch: `dispatchTask` and the reconciler

**Shared entry point:** `dispatchTask(ctx, task)` at
`packages/lib/src/services/orchestrator/dispatchTask.ts` moves a task to
`in_progress` and enqueues a `run_task` on its lane with a full brief
(built by `buildTaskBrief`) as the prompt. Used by:

- `taskCreate` tool (for unblocked children).
- `handleScheduledJob` (scheduled-job start).
- The reconciler (for work with cleared dependencies).

The **brief** (`buildTaskBrief`) contains everything the agent needs to
start: instructions, expectedInput, expectedOutput, existing attachments,
latest comment, and a "From scheduled job X" prefix when `originJobId` is
set. The agent never needs a `taskShow` to begin work.

### The reconciler

**Entry point:** `reconcile(ctx, triggerAgentId)` at
`packages/lib/src/services/orchestrator/reconcileTasks.ts:50`.

The reconciler is a **deterministic, non-LLM** pass that runs as a tail-call
after any lane finishes (`inbox/consumer/index.ts`). It handles tasks that
can't dispatch immediately — mostly tasks whose blockers just closed. It
does three things:

1. **Circuit-break over-escalated tasks** — if `escalationCount >= 3`, close
   the task and enqueue `task_needs_attention` to the assigner or epic owner.
   Prevents infinite escalation loops.
2. **Dispatch ready work** — pull tasks via `getReadyWork` (status=`open`,
   not deferred, no unclosed deps). For each:
   - Validate the assignee is a real agent.
   - If `escalationCount > 0` (previously worked, now retry), move to
     `in_progress` and enqueue `resume_task` with a nudge.
   - Otherwise call `dispatchTask` (same path as `taskCreate` and scheduled
     jobs).
3. **Route unassigned work** — group by parent and enqueue
   `tasks_need_assignment` to the epic owner (or main lane) so a manager can
   re-route.

Dispatch hands off through the inbox, not a direct call — see
`docs/agent-inbox-queue.md` for the durable-inbox + SQS mechanics.

## Execution: the task lane

**Entry point:** `runTaskLane` at
`packages/lib/src/services/orchestrator/runTaskLane.ts:73`.

When the inbox consumer picks up a `run_task` or `resume_task` item, it calls
`runTaskLane`, which:

1. **Assembles related-task context** — on a system trigger (initial dispatch
   or notification, not a user follow-up), injects a SYSTEM message listing
   siblings (if child) or children (if parent) with their attachments and
   comments.
2. **Generates a plan** on a system trigger and writes it as a SYSTEM message.
3. **Renders the system prompt** using sections: `identity`, `taskPreamble`
   (which injects `{{taskId}}` and title), `taskWorkflow`, `taskFileEditor`,
   optional `taskSandbox`, optional `taskPlan`, `jobs`, `memory`. The prompt is
   origin-agnostic — how the task was created (delegation, scheduled job,
   subtask spawn) isn't in the prompt. Any origin context belongs in the
   task's `instructions`.
4. **Binds task-scoped tools** (`buildTaskTools`) — sandbox, file editor,
   `attachFile`/`attachLink`, `generateImage`, `generateSpeech`, plus the
   task-lane tracking tools (`taskCreate`, `taskList`, `taskReady`,
   `taskShow`, `taskUpdate`).
5. **Runs the agent turn** (`runLane.ts`) — builds message history (with
   compaction if near token limit), invokes the model, persists every
   message/tool call to `AgentLog`.

The task stays in `in_progress` throughout execution. Status moves only when
the agent calls `taskUpdate` or a parent rejects.

## Subtask decomposition

When a task-lane agent calls `taskCreate`, the new task is automatically a
child (`parentId = currentTaskId`). The child sits in `open` until the next
reconciler pass dispatches it to its own lane.

Decomposition mechanics:

- **No direct parent → child message.** The child runs in isolation with its
  own context. Sibling/parent context is injected by `runTaskLane` when the
  child starts (`runTaskLane.ts:20-66`).
- **Parent is not actively running** while children execute — it's waiting in
  its lane for the next inbox item.
- **Child completion wakes the parent** via `task_ready_for_review` inbox
  item (`taskUpdate.ts:106-138`) routed to `task:${parentId}`, with the child's
  title and closing notes as payload.

## Completion

An agent closes its own task by calling `taskUpdate(status: "closed", notes)`.
Notes are **required** when closing (`taskUpdate.ts:55-66`).

The flow (`taskUpdate.ts:72-100`, `taskLifecycle.ts:123-175`):

1. **Redundant-close short-circuit** — if already closed, no-op. Prevents
   duplicate comments and double-fired `task_ready_for_review` cascades.
2. **Reject if children still open** (`taskLifecycle.ts:136-137, 36-52`). You
   must close subtrees **bottom-up** — leaves first, then their parent.
   *There is no auto-close mechanism anywhere in the codebase.*
3. **Write status=closed, closedAt, closeReason** and publish `taskUpdated`
   for the task and its parent (`taskLifecycle.ts:169-172`).
4. **Notify parent or assigner** with `task_ready_for_review`
   (`taskUpdate.ts:106-138`):
   - Child tasks → `task:${parentId}` lane, owned by the parent's agent.
   - Top-level tasks → `main` lane, owned by `assignerAgentId ?? agentId`.

The reviewer can then accept the work (do nothing; task stays closed) or send
it back — see below.

## Rejection & escalation

Two distinct mechanisms, both bumping `escalationCount`:

**Rejection** — the assigner reopens a closed task to send the work back for
revision. Transition `closed → open` via `updateTaskStatus`
(`taskLifecycle.ts:77, 99-101`). The reconciler will re-dispatch as
`resume_task` since `escalationCount > 0` (`reconcileTasks.ts:131-152`).

**Agent escalation** — the worker calls `taskUpdate(escalate: true, notes)`.
This does **not** change status (`taskUpdate.ts:106-138`): the task stays
`in_progress`, `escalationCount` is incremented, and a `task_needs_attention`
item is enqueued to the parent/assigner lane. Notes are required
(`taskUpdate.ts:55-66`).

**Circuit breaker** — when `escalationCount >= 3`, the reconciler
auto-closes the task with reason `escalation_limit` and notifies the epic
owner (`reconcileTasks.ts:60-88`). Prevents infinite escalation loops.

## Dependencies

Recorded via `taskDep(taskId, dependsOnId, action: "add" | "remove")`
(`packages/lib/src/services/tools/taskTracking/taskDep.ts`).

- **Cycle detection** runs BFS from `dependsOnId` looking for `taskId`
  (`taskDeps.ts:24-43`); rejects with an error if a cycle would form.
- **`getReadyWork`** (`taskDeps.ts:180-231`) filters out any task whose
  dependencies aren't all `closed` — this is what keeps blocked tasks out of
  the dispatcher.
- `taskBlocked` and `taskDepTree` are main-lane-only diagnostic tools
  (`tools/taskTracking/index.ts:33-40`); workers don't see them.

## Attachments and comments

Output from a task becomes visible to its parent/assigner via two channels:

- **`attachFile` / `attachLink`** (`addTaskAttachment.ts:10-94`) — adds an
  attachment row. Pubsub fires `taskUpdated` for both the task and its parent,
  so the parent's task card re-renders with the child's output.
- **`notes` on `taskUpdate`** (`taskUpdate.ts:94-100`) — appends to the task's
  comment log.

Guidance for agents lives in the `taskCreate` tool's `expectedOutput`
description: be specific about comment vs. attachment vs. both, and what
format. The assignee's close-notes then fulfill that contract.

## Key invariants and limits

| Limit                          | Value | Enforced at                                      |
| ------------------------------ | ----- | ------------------------------------------------ |
| Max task nesting depth         | 3     | `createTask.ts:6, 70-86`                         |
| Max escalations before auto-close | 3  | `reconcileTasks.ts:5, 60`                        |
| Task IDs                       | 8-char alphanumeric | `createTask.ts:8-18`                    |
| Status values (all layers)     | `open` / `in_progress` / `closed` | `taskLifecycle.ts:21`, `typeDefs.ts`, `taskUpdate.ts:12` |
| Close-notes                    | Required on close and escalate | `taskUpdate.ts:55-66`     |
| Close blocked on open children | Always | `taskLifecycle.ts:36-52, 136-137`                |

## Related docs

- `docs/agent-inbox-queue.md` — how inbox items get dispatched (SQS doorbell,
  per-agent lane serialization).
- `docs/agent-orchestration.md` — older, partially-stale overview; status
  values and lifecycle there predate the current `open/in_progress/closed`
  vocabulary.
- `docs/ddb-access-patterns.md` — GSI layout used by task queries.
