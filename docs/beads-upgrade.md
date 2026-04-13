# Beads Upgrade: Unified Task Orchestration

Replace the bespoke `backgroundTask` / `delegate` / `completeTask` / `updateTask` tools, the `Task` DynamoDB entity, and the manager's manual dispatch loop with [Beads](https://github.com/gastownhall/beads) as the single system of record for all task state.

## Motivation

The current system has three problems:

1. **Manager does mechanical work.** After planning, the manager must call `delegate()` per task, track active delegations, receive each `task_update`, call `delegate()` for the next wave, and so on. Each cycle costs an LLM inference turn for what is a deterministic dispatch loop.

2. **Flat task model.** Tasks have no dependencies, no hierarchy, no blocking relationships. The manager must hold the entire plan in its context window and manually reason about ordering. Long-horizon tasks lose context after compaction.

3. **Two tools for one concept.** `backgroundTask` (self-assigned, inherits context) and `delegate` (cross-agent, self-contained brief) are the same operation with different defaults. The system prompt must explain both, and the model must choose correctly.

Beads solves all three: it's a dependency-aware graph that persists across sessions, and a system-level reconciler can dispatch ready work without LLM involvement.

## Design Principles

- **Beads is the abstraction layer.** No wrapper around beads — agents use it directly. All beads features (dependencies, gates, molecules, messaging) are available.
- **One concept for all work.** A bead can be a simple task or an epic with children. Same API, same lifecycle, same UX.
- **LLMs plan, systems dispatch.** The agent creates beads. A deterministic reconciler dispatches ready work through the existing inbox/SQS infrastructure.
- **Workers are beads-native.** Workers use beads MCP tools directly. They can comment, decompose, flag blockers, and read sibling tasks — capabilities they don't have today.
- **Beads MCP everywhere.** Both main lane and task lane use the same beads MCP tools. No sandbox dependency for bead operations.
- **Inbox/SQS is untouched.** Delivery guarantees, per-lane serialization, and crash recovery are proven infrastructure. Beads replaces the task data model, not the message bus.

## Architecture

```
User message                           Scheduled trigger
     │                                        │
     ▼                                        ▼
┌─────────┐   beads MCP tools   ┌────────────────────────┐
│  Main   │ ──────────────────→ │      Dolt Server       │
│  Lane   │                     │  (shared per workspace) │
└─────────┘                     └───────────┬────────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │     Reconciler (system)    │
                              │  ready_work → enqueueWork  │
                              └─────────────┬─────────────┘
                                            │
                    ┌───────────────────────┬┴──────────────────────┐
                    ▼                       ▼                       ▼
             ┌────────────┐         ┌────────────┐         ┌────────────┐
             │ Task Lane  │         │ Task Lane  │         │ Task Lane  │
             │ Agent A    │         │ Agent A    │         │ Agent B    │
             │ (MCP tools)│         │ (MCP tools)│         │ (MCP tools)│
             └────────────┘         └────────────┘         └────────────┘
```

All agents — manager and workers — read and write the same Dolt database via beads MCP tools. Both main lane and task lane use the same tool set.

### Shared Dolt Server

One Dolt server per workspace. The beads MCP server connects to it and routes requests per-workspace using `set_context`.

Server mode supports concurrent writers. Embedded mode (single-writer) is simpler for development.

## Unified Task Model

Every unit of work is a bead. The three current patterns map cleanly:

### Background task → self-assigned bead

```
# Before
backgroundTask({ title: "Create podcast", prompt: "..." })

# After
beads_create_issue({
  title: "Create podcast",
  assignee: "self",
  description: "User wants a podcast about..."
})
```

### Delegation → bead assigned to another agent

```
# Before
delegate({ targetAgentId: "writer", title: "Draft blog", brief: "..." })

# After
beads_create_issue({
  title: "Draft blog",
  assignee: "writer-agent",
  description: "...(full brief)..."
})
```

### Deferred work → bead with defer_until

```
# Before
createFollowUp({ delayMs: 900000, prompt: "Check for reply" })

# After
beads_create_issue({
  title: "Check for dealer reply",
  assignee: "self",
  defer_until: "2026-04-13T15:15:00Z",
  description: "Check email for reply from dealer..."
})
```

### Scheduled job → EventBridge creates bead

```
# Before
EventBridge cron → Lambda → enqueueWork({ type: "scheduled_job", ... })

# After
EventBridge cron → Lambda → beads_create_issue({ title: "Weekly digest", assignee: <agentId> })
→ reconciler picks it up on next tick
```

### Simple task vs. epic

No special API — a bead is a bead:

```
# Simple task
beads_create_issue({ title: "Summarize this PDF", assignee: "researcher-agent" })

# Epic with parallel children and blocking dependencies
beads_create_issue({ title: "Competitor analysis", type: "epic" })          → bd-a1b2
beads_create_issue({ title: "Research A", assignee: "researcher",
                     parent: "bd-a1b2" })                                   → bd-c3d4
beads_create_issue({ title: "Research B", assignee: "researcher",
                     parent: "bd-a1b2" })                                   → bd-e5f6
beads_create_issue({ title: "Write report", assignee: "writer",
                     parent: "bd-a1b2", blocked_by: ["bd-c3d4","bd-e5f6"] })→ bd-g7h8
```

Children are parallel by default. Only explicit `blocks` edges create sequencing. The agent decides the complexity based on the request.

## Detailed Flow

### Phase 1: User Message → Manager

Unchanged. Inbox/SQS delivers the message, consumer drains, `runMainLane` fires.

```
sendMessage mutation
  → enqueueWork(agentId, "main", { type: "user_message", ... })
  → SQS doorbell
  → consumer: drainInbox → routeBatch → runMainLane
```

### Phase 2: Manager Plans

The manager creates beads using MCP tools. This is the only LLM turn required for planning. The manager sets `assignee` on each bead — no separate dispatch step.

```
Manager LLM turn:

  Step 1 (one tool call):
    beads_create_issue("Competitor analysis", type=epic)    → bd-a1b2

  Step 2 (parallel tool calls — all independent, executed concurrently):
    beads_create_issue("Research A", assignee=researcher, parent=bd-a1b2, ...)
    beads_create_issue("Research B", assignee=researcher, parent=bd-a1b2, ...)
    beads_create_issue("Write report", assignee=writer, parent=bd-a1b2,
                       blocked_by=[research-A, research-B])
    beads_create_issue("Draft blog", assignee=writer, parent=bd-a1b2,
                       blocked_by=[write-report])

  Manager responds to user: "Planned 5 tasks. Research starts now."
```

Manager turn ends. No `delegate()` calls. Two inference steps instead of six — see [Parallel Tool Calls](#parallel-tool-calls).

#### Parallel Tool Calls

The Vercel AI SDK's `streamText` already supports parallel tool calls. When the model emits multiple tool calls in a single response, the SDK executes them concurrently within the same step (`onStepFinish` receives all calls in `step.toolCalls[]`). No code change needed — this is model behavior.

For bead planning, the epic must be created first (step 1) because children reference the parent ID. But all children are independent of each other and can be created in a single parallel step (step 2). The system prompt encourages this:

> When creating multiple beads, batch independent creates into a single response. The system executes them in parallel.

This reduces the planning phase from N+1 inference steps (one per bead) to 2 steps (epic + all children), regardless of how many children there are.

### Phase 3: Reconciler Dispatches

A system-level function (no LLM) runs after the manager's turn. It queries `beads_ready_work` and dispatches assigned beads through the existing inbox:

```typescript
// services/orchestrator/reconcileBeads.ts (~80 lines)
async function reconcile(ctx, workspaceId, triggerAgentId) {
  const ready = await bd.readyWork({});
  const needsAttention = [];

  for (const bead of ready) {
    if (!bead.assignee) {
      needsAttention.push(bead);
      continue;
    }

    const targetAgentId = resolveAssignee(bead.assignee, triggerAgentId);
    const isSelfAssigned = targetAgentId === triggerAgentId;

    await bd.updateIssue({ issue_id: bead.id, status: "in_progress" });

    await ctx.services.inbox.enqueueWork(ctx, targetAgentId, `task:${bead.id}`, {
      type: "run_task",
      payload: {
        beadId: bead.id,
        prompt: bead.description,
        inheritContext: isSelfAssigned,
      },
    });
  }

  // Only wake manager for unassigned beads
  if (needsAttention.length > 0) {
    await ctx.services.inbox.enqueueWork(ctx, triggerAgentId, "main", {
      type: "beads_need_assignment",
      payload: { beadIds: needsAttention.map(b => b.id) },
    });
  }

  await closeCompletedEpics(ctx, triggerAgentId);
}
```

`resolveAssignee` maps `"self"` to the triggering agent's ID; other values are treated as literal agent IDs.

**Triggers:**

| Event | Trigger mechanism |
|---|---|
| Manager creates beads | Tail call after `runMainLane` when beads tools were used |
| Worker closes a bead | Tail call after `runTaskLane` completes |
| Deferred beads become ready | Periodic EventBridge rule (every 60s) |
| External gate clears | Webhook → gate check → reconcile |

### Phase 4: Worker Executes

The consumer dispatches to `runTaskLane` as today. The worker gets the bead ID and uses beads MCP tools directly — the same tools available on the main lane:

```
# Read assignment
beads_show_issue({ issue_id: "bd-c3d4" })

# Post progress (replaces updateTask tool)
beads_update_issue({ issue_id: "bd-c3d4", notes: "Analyzing competitor A pricing model..." })

# Decompose own work if needed
beads_create_issue({ title: "Check API docs", assignee: "self", parent: "bd-c3d4" })

# Flag a blocker (triggers manager wake-up via reconciler)
beads_update_issue({ issue_id: "bd-c3d4", status: "blocked" })

# Cross-task context — read sibling beads
beads_show_issue({ issue_id: "bd-e5f6" })

# Leave notes for downstream agents
beads_update_issue({ issue_id: "bd-g7h8", notes: "Competitor A uses usage-based pricing" })

# Complete (replaces completeTask tool)
beads_close_issue({ issue_id: "bd-c3d4", reason: "Research complete. Key findings: ..." })
```

Beads MCP tools are available on the task lane regardless of whether the agent has a sandbox.

### Phase 5: Cascade

After `runTaskLane` completes, the consumer calls the reconciler as a tail call:

```typescript
// In consumer, after task lane finishes:
const bead = await bd.showIssue({ issue_id: beadId });
if (bead.status === "closed") {
  await reconcile(ctx, workspaceId, bead.assignee);
}
```

The reconciler calls `beads_ready_work`, which now returns any beads unblocked by the closure. Dispatch is automatic:

```
Worker closes bd-c3d4 (research A) → reconcile → nothing ready (B still open)
Worker closes bd-e5f6 (research B) → reconcile → bd-g7h8 (report) now unblocked!
  → auto-dispatch to writer-agent via inbox
Writer closes bd-g7h8 (report)     → reconcile → bd-k1l2 (blog) now unblocked!
  → auto-dispatch to writer-agent
Writer closes bd-k1l2 (blog)       → reconcile → all children closed
  → close epic bd-a1b2
  → notify manager: "Epic complete"
```

The manager is never woken for dispatch. It only wakes for:

| Event | Why |
|---|---|
| A ready bead has no assignee | Needs routing decision |
| A worker marks a bead `blocked` | Needs re-planning or human input |
| An epic completes | Deliver results to user |
| User sends a message | Always |

### Manager LLM Turns: Before vs. After

For a 5-task epic:

| Step | Before | After |
|---|---|---|
| Plan the work | 1 turn | 1 turn |
| Dispatch wave 1 | 1 turn | 0 (reconciler) |
| Receive completion, check ready | 1 turn × 3 workers | 0 (reconciler) |
| Dispatch wave 2 | 1 turn | 0 (reconciler) |
| Receive completion, dispatch wave 3 | 1 turn | 0 (reconciler) |
| Receive final completion, report to user | 1 turn | 1 turn (epic_complete) |
| **Total** | **7 turns** | **2 turns** |

## Worker Capabilities

Workers gain significant capabilities by having direct beads access via MCP tools:

| Capability | Current system | With beads |
|---|---|---|
| Report progress | `updateTask("Researching...")` — flat string | `beads_update_issue` — timestamped, queryable, visible to all agents |
| Decompose own work | Not possible | `beads_create_issue` with parent — worker creates sub-tasks |
| Flag blockers | Not possible (task stalls silently) | `beads_update_issue` status=blocked — triggers manager notification |
| Read sibling context | Not possible | `beads_show_issue` — read any bead in the graph |
| Leave notes for downstream | Not possible | `beads_update_issue` notes on downstream beads |
| Report completion | `completeTask("done")` — opaque string to manager | `beads_close_issue` — structured, in the graph, triggers cascade |

## Changes to Main Lane

The main lane tool set simplifies:

```typescript
// Before
tools: {
  backgroundTask: backgroundTaskTool(ctx, agentId),
  delegate: delegateTool(ctx, agentId, team),  // managers only
  readFile, listFiles, saveMemory, recallMemory,
  listJobs, scheduleJob, updateJob, viewImage,
}

// After
tools: {
  ...beadsMcpTools,  // beads_create_issue, beads_ready_work, beads_list_issues, etc.
  readFile, listFiles, saveMemory, recallMemory,
  listJobs, scheduleJob, updateJob, viewImage,
}
```

`backgroundTask` and `delegate` are removed. The system prompt replaces the explanation of two tools with one concept:

> Create beads to plan and execute work. Assign to yourself for work you'll do, or to a teammate by agent ID. Add dependencies between beads to control ordering. The system dispatches ready work automatically.

## Changes to Task Lane

Beads MCP tools replace `updateTask` and `completeTask`. They're available on the task lane the same way they are on the main lane — no sandbox required:

```typescript
// Before
tools: {
  updateTask, completeTask,
  ensureSandbox, runCommand, readCommandOutput,
  readFile, writeFile, editFile, listFiles, glob, grep,
  attachFile, attachLink,
  ...skillTools,
}

// After
tools: {
  ...beadsMcpTools,  // same beads tools as main lane
  ensureSandbox, runCommand, readCommandOutput,  // only if sandbox enabled
  readFile, writeFile, editFile, listFiles, glob, grep,
  attachFile, attachLink,
  ...skillTools,
}
```

`updateTask` and `completeTask` are removed. Workers use `beads_close_issue` and `beads_update_issue` directly. This means task lanes that don't use a sandbox (e.g., research agents, summarization agents) still have full bead interaction without booting an EC2 instance.

### Task Lane System Prompt

The delegated task section (`delegatedTaskSection.ts`) changes from:

> You are working on a task delegated by @manager. Everything you need is in the brief below. When done, call `completeTask`.

To:

> You are working on bead `{{beadId}}`. Use `beads_show_issue` to read your full assignment, dependencies, and any comments from other agents. Use `beads_update_issue` for progress updates. Use `beads_close_issue` when done. If the work is larger than expected, use `beads_create_issue` to decompose it into sub-beads.

For self-assigned beads (background tasks), `runTaskLane` still injects main-lane conversation context when `inheritContext` is set on the inbox payload — same behavior as today, triggered by the reconciler detecting a self-assignment.

## UX: Bead Cards in Chat

### Anchor Pattern

Each `beads_create_issue` MCP tool call produces an AgentLog entry (role: TOOL) with the bead ID in the result. The GraphQL resolver looks up the bead and returns its parent/children status. The UI decides rendering:

- **Bead with no parent** (epic or standalone) → render `BeadCard` with tree
- **Bead with a parent** → render lightweight hint (e.g., `⊕ Created "Research competitor A"`)

As the agent creates children in sequence during a single turn, the parent `BeadCard` live-updates via GraphQL subscription. Each child appears in the tree as it's created. Child tool calls render as hints or are collapsed entirely since the parent card already shows them.

### BeadCard: Simple Task

```
┌─────────────────────────────────────┐
│ 🔍 Research competitor pricing      │
│ @researcher · Analyzing pricing...  │
└─────────────────────────────────────┘
```

Shows: bead title, assignee, latest comment as subtitle. Tappable → navigates to bead detail view.

### BeadCard: Epic with Children

```
┌─────────────────────────────────────┐
│ Competitor analysis          3/5    │
│                                     │
│ ✓ @researcher Research competitor A │
│   Found 3 key differentiators       │
│ ✓ @researcher Research competitor B │
│   Completed pricing analysis        │
│ ● @researcher Research competitor C │
│   Analyzing API documentation...    │
│ ○ @writer Write comparison report   │
│   Waiting on research               │
│ ○ @writer Draft blog post           │
│   Waiting on report                 │
└─────────────────────────────────────┘
```

Status indicators: `✓` closed, `●` in_progress, `○` open/blocked. Each child row shows assignee, title, and latest comment. Tapping a child row navigates to that child's detail view.

### ID Stability

Bead IDs are hash-based and stable. When a simple bead gains children (worker decomposes its task), the parent ID doesn't change. The card automatically evolves from simple to tree view as children appear.

### Live Updates

Worker progress flows through GraphQL subscriptions on bead state. When a worker calls `beads_update_issue` or `beads_close_issue`, the bead card in the manager's chat updates in real time — checkmarks appear, status messages update, progress counters increment — without new AgentLog entries.

### GraphQL Schema

```graphql
type Bead {
  id: ID!
  title: String!
  status: BeadStatus!       # open, in_progress, blocked, closed
  assignee: String           # agent ID
  assigneeName: String       # resolved display name
  parentId: ID
  latestComment: String      # most recent comment text
  children: [Bead!]          # one level deep, populated for epics
}

enum BeadStatus {
  OPEN
  IN_PROGRESS
  BLOCKED
  CLOSED
}
```

The resolver backs this with `beads_show_issue` or with the Task projection (see Migration Strategy below).

### Navigation

| Tap target | Route |
|---|---|
| Simple bead card | `/agents/:agentId/beads/:beadId` — full bead detail + AgentLog |
| Epic card header | `/agents/:agentId/beads/:beadId` — epic overview with tree |
| Child row in epic card | `/agents/:agentId/beads/:childBeadId` — child detail |

## What Changes, What Stays, What's New

### Removed

| Component | Replaced by |
|---|---|
| `backgroundTaskTool` | Agent creates self-assigned bead via MCP |
| `delegateTool` | Agent creates bead with target agent's ID |
| `completeTaskTool` | Worker calls `beads_close_issue` MCP tool |
| `updateTaskTool` | Worker calls `beads_update_issue` MCP tool |
| `createFollowUp` / EventBridge one-shots | Bead with `defer_until` + reconciler timer |
| `agent_self_followup` inbox type | Reconciler dispatches deferred beads |
| `task_update` inbox type | Reconciler detects completion, wakes manager only when needed |
| `activeDelegations` query in `buildAgentLaneContext` | `beads_list_issues` with assignee + status filter |
| Team roster ACL in `delegate()` | Bead assignee validation in reconciler |
| `BackgroundTaskCard` component | `BeadCard` |
| `DelegateCard` component | `BeadCard` |

### Kept (unchanged)

| Component | Why |
|---|---|
| DDB inbox + SQS doorbell (`enqueueWork`) | Delivery guarantee, wake-up, backpressure |
| Per-lane serialization (`activeLanes`) | Prevent concurrent LLM calls |
| Lane routing in consumer (main / task / system) | Same batch routing logic |
| `user_message` / `user_input_request_reply` inbox types | User ↔ agent communication unchanged |
| AgentLog (append-only) | UX conversation rendering unchanged |
| Sweeper (stale item recovery, 3-min interval) | Crash recovery unchanged |
| EventBridge cron for `AgentJob` | Recurring triggers still need a scheduler |
| Sandbox infrastructure (EC2 + Docker) | Workers that need compute still use it |
| Skill tools, file tools, sandbox tools | Workers still need capabilities |
| `runLane` / `runAgentTurn` orchestration | LLM turn execution unchanged; parallel tool calls within a step already supported |

### New

| Component | Purpose | Size |
|---|---|---|
| Dolt server (per workspace) | Shared bead storage for all agents | Infrastructure (CDK construct) |
| Beads MCP tools on task lane | Workers interact with beads without sandbox | Tool wiring in `buildTaskTools` |
| `reconcileBeads()` | Bridge between beads and inbox | ~80 lines, `services/orchestrator/reconcileBeads.ts` |
| Reconciler timer | Dispatch deferred beads | EventBridge rule, 60s interval |
| `BeadCard` component | Replaces `BackgroundTaskCard` + `DelegateCard` | ~150 lines, `shared/LogEntryView/BeadCard.tsx` |
| `Bead` GraphQL type + resolver | Bead state for UI | ~40 lines |
| `beads_need_assignment` inbox type | Wake manager when unassigned beads are ready | Enum value + consumer case |
| `epic_complete` inbox type | Notify manager when all children close | Enum value + consumer case |

## Beads Features Unlocked

Features available immediately by going all-in on beads — no additional implementation:

| Feature | How it works |
|---|---|
| **Dependency graph** | `blocks`, `parent-child`, `conditional-blocks`, `waits-for` edges. `beads_ready_work` computes unblocked work automatically. |
| **Conditional execution** | `conditional-blocks` — "run B only if A fails." |
| **Fan-out / fan-in** | Multiple beads block a single downstream bead. `beads_ready_work` handles the fan-in when all close. |
| **Gates** | `beads_create_issue` with type=gate and await fields — block until a PR merges, CI passes, or a timer expires. |
| **Worker self-organization** | Workers call `beads_create_issue` with parent to create sub-beads. Reconciler respects the new graph. |
| **Cross-task context** | Any agent can call `beads_show_issue` on any bead in the workspace. Shared situational awareness. |
| **Agent-to-agent messaging** | Message-type beads with threading via `replies-to` dependencies. |
| **Molecule templates** | Reusable workflow graphs that can be instantiated as a set of beads. |
| **Semantic compaction** | Old closed beads are summarized to conserve context window. |
| **Cross-session persistence** | Agent resumes tomorrow, calls `beads_ready_work`, knows exactly where things stand. |
| **Audit trail** | Dolt tracks every field change with actor and timestamp. |

## Consumer Changes

### New inbox types

Add to `InboxItemType` in `enqueueWork.ts`:

```typescript
| "beads_need_assignment"  // Unassigned bead became ready, manager must route
| "epic_complete"          // All children of an epic closed
```

### Reconciler integration in consumer

After `runMainLane` and `runTaskLane`, call the reconciler if beads were touched:

```typescript
// In ringDoorbell, after lane processing:

if (lane === "main") {
  await processMainLaneItems(ctx, agentLaneCtx, agentId, items);
  // Check if beads tools were used during this turn
  if (beadsToolsUsed(ctx)) {
    await reconcile(ctx, workspaceId, agentId);
  }
} else if (lane.startsWith("task:")) {
  const beadId = lane.slice(5);
  // ... existing task lane processing ...
  await processTaskGroup(ctx, agentLaneCtx, agentId, beadId, nonResumeItems);
  // Auto-reconcile after task lane completes
  await reconcile(ctx, workspaceId, agentId);
}
```

### task_update suppression

The current `task_update` flow (worker → `completeTask` → enqueue to manager main lane → write AGENT log → optionally run inference) is replaced by the reconciler cascade. When a worker closes a bead:

1. Reconciler detects closure, dispatches next wave (no manager involvement)
2. Manager is only woken for `beads_need_assignment` or `epic_complete`
3. Completion messages appear in the bead's comment history, not as AGENT log entries on the manager's main lane

For the `epic_complete` case, the reconciler writes a summary to the manager's main lane and triggers inference so the manager can deliver results to the user.

## Dolt Server Infrastructure

### Options

| Mode | Pros | Cons |
|---|---|---|
| **Embedded** (default) | Zero infrastructure, single binary | Single-writer, file locking |
| **Server mode** (Dolt SQL server) | Concurrent writers, shared across agents | Needs managed process |

Recommendation: **server mode** for production (multiple agents write concurrently), **embedded** for development and single-agent workspaces.

### CDK construct

A new `DoltServerStack` or extension of `SandboxEc2Stack` that:

1. Runs a Dolt SQL server as a long-lived process (container or EC2 sidecar)
2. One instance per workspace
3. Stores data on EBS (persistent)
4. Exposes port 3307 to sandbox security group
5. Lifecycle tied to workspace — starts on first bead operation, hibernates on idle

### Initialization

The reconciler (or the first beads MCP tool call) initializes beads if not already initialized via `beads_init`.

## Migration Strategy

### Phase 1: Bridge (Task projection)

Keep the `Task` DDB entity as a read projection of bead state. The reconciler writes/updates Task rows when it dispatches and closes beads. The existing `useTaskInfo` hook, GraphQL subscriptions, and UI components continue to work unchanged.

```typescript
// In reconciler, when dispatching:
await ctx.services.tasks.createTask(ctx, {
  id: bead.id,  // use bead ID as task ID
  agentId: targetAgentId,
  title: bead.title,
  assignerAgentId: managerAgentId,
});

// In reconciler, when closing:
await ctx.services.tasks.updateTask(ctx, bead.id, {
  status: "completed",
  message: closeReason,
});
```

This keeps the mobile app working while the new `BeadCard` is built.

### Phase 2: BeadCard

Build `BeadCard` component that renders based on bead state from GraphQL. Deploy alongside existing `BackgroundTaskCard` / `DelegateCard` — new beads render with `BeadCard`, old tasks render with legacy cards.

### Phase 3: Remove legacy

Once `BeadCard` is stable and all active tasks have completed:

1. Remove `backgroundTaskTool`, `delegateTool`, `completeTaskTool`, `updateTaskTool`
2. Remove `BackgroundTaskCard`, `DelegateCard`
3. Remove `task_update` inbox type handling
4. Remove Task projection (or keep as cache layer)
5. Query beads directly from GraphQL resolvers

## Open Questions

### Bead assignee validation

Today `delegate()` checks the manager's team roster ACL. With beads, the manager writes any string as `assignee`. The reconciler should validate that the assignee is a real agent ID and that the manager has permission to assign to it. On validation failure, treat as `beads_need_assignment` — wake the manager with an error.

### Context inheritance for self-assigned beads

Background tasks today inherit main-lane conversation history via `buildMainLaneContext()` in `runTaskLane`. Self-assigned beads should preserve this behavior. The reconciler sets `inheritContext: true` on the inbox payload when `assignee === "self"`, and `runTaskLane` copies main-lane history as it does today.

### Deferred bead precision

Beads `defer_until` is checked by the reconciler timer (60s interval). This means up to 60s of latency for deferred work. For most cases (check back in 15 min) this is fine. For precision timing (send email at exactly 3pm), keep EventBridge one-shot schedules that create a bead on fire — the reconciler picks it up within 60s.

### Multi-workspace routing

The beads MCP server supports per-request workspace routing via `set_context`. For agents working across multiple workspaces, each bead operation must target the correct Dolt server. The reconciler needs workspace context when dispatching.

### Epic closure semantics

Should the reconciler auto-close an epic when all children are closed? Beads provides `epic_closeable` on `beads_show_issue` output. The reconciler checks this and closes automatically, then notifies the manager. If the manager wants to keep the epic open for review, it can set a flag on the epic bead.
