# Agent Inbox & Queue

A durable inbox + SQS wake-up architecture for all agent work. Every trigger flows through a single path: write to inbox, ring the doorbell, consumer drains and processes.

## Motivation

The inbox architecture solves several problems that arise with simpler approaches (polling, fire-and-forget dispatch):

1. **Durability** — work is persisted in DynamoDB before processing, surviving server crashes
2. **Precision** — EventBridge schedules fire at exact times, no polling delay
3. **Backpressure** — per-agent serialization prevents concurrent LLM calls for the same agent
4. **Efficiency** — no periodic scanning of DynamoDB tables
5. **Serialization** — one processing loop per agent at a time, enforced by the `activeAgents` set
6. **Extensibility** — new trigger types (webhooks, event streams, user replies) all use the same `enqueueWork()` path

## Design

Two-stage architecture: **DynamoDB Inbox** (durable work ledger) + **SQS** (wake-up signal).

```
 PRODUCERS                              CONSUMER
 ─────────                              ────────

 User message ────┐
 EventBridge ─────┤                  ┌──────────────────────┐
 User notif reply ┼─→ DDB Inbox ──→ │  Server               │
 Agent self ──────┘   + SQS bell    │  (long-polling SQS)   │
                                     │  drain inbox → run    │
                                     └──────────────────────┘
```

SQS carries no work payload — it is a doorbell. The inbox is the source of truth.

### Why two stages?

A single SQS queue can't batch messages for the same agent (FIFO delivers one per group per receive call). With an inbox, the consumer drains all pending items for an agent in one shot — 10 user messages become one agent turn, not 10 sequential turns.

SQS also can't be queried, cancelled, or inspected. The inbox in DDB gives full visibility into pending work, supports cancellation, and enables the UI to show queued items.

## Inbox Entity

Each work item is a row in the single-table DDB design.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique item ID |
| `agentId` | string | Target agent |
| `type` | enum | Work type (see below) |
| `payload` | object | Type-specific data |
| `isRead` | boolean | `false` when enqueued, `true` once the consumer picks it up |
| `createdAt` | string (ISO 8601) | When the item was enqueued |

**DynamoDB key pattern:**

| Key | Value |
|-----|-------|
| PK | `AGENT_INBOX#<agentId>` |
| SK | `ITEM#<createdAt>#<id>` |
| GSI2PK | `INBOX_UNREAD` (removed when isRead = true) |
| GSI2SK | `<createdAt>` |

- Query an agent's unread work: `PK = AGENT_INBOX#<agentId>`, filter `isRead = false`
- SK is timestamp-prefixed so items return in arrival order
- GSI2 exists for the recovery sweeper (see below)
- Remove GSI2 keys when marking `isRead = true` so read items drop out of the index

### Work Types

```typescript
type InboxItemType =
  | "user_message"
  | "user_task_message"
  | "run_task"
  | "scheduled_job"
  | "agent_self_followup"
  | "user_notification_reply"
  | "core_memory_review"
  | "resume_task";
```

- `user_task_message` — user sends a message directed at a specific task (routed to main lane)
- `core_memory_review` — periodic review of agent memory (routed to task lane)
- `resume_task` — resumes inference on a task lane from existing log without writing a new message (used by shell guard after command approval resolution)

## Enqueue

Every producer follows the same two-step pattern: write to inbox, ring the doorbell.

```typescript
async function enqueueWork(ctx: ServiceContext, agentId: string, item: InboxItemInput) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // 1. Durable record
  await ddb.put({
    TableName: TABLE,
    Item: {
      _et: "InboxItem",
      pk: `AGENT_INBOX#${agentId}`,
      sk: `ITEM#${createdAt}#${id}`,
      gsi2pk: "INBOX_UNREAD",
      gsi2sk: createdAt,
      id,
      agentId,
      ...item,
      isRead: false,
      createdAt,
    },
  });

  // 2. Doorbell — "agent X has work"
  await sqs.sendMessage({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ agentId }),
  });
}
```

The SQS message is intentionally minimal. It carries only `agentId` — the consumer reads actual work from the inbox. Standard SQS queue (not FIFO). Duplicate or out-of-order doorbells are harmless.

## Consumer

The server long-polls SQS. On receiving a doorbell, it drains the agent's inbox and processes all pending items. Per-agent serialization is enforced in-memory.

```typescript
const activeAgents = new Set<string>();

async function startWorker(ctx: ServiceContext) {
  while (!shuttingDown) {
    const resp = await sqs.receiveMessage({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    });

    await Promise.all(
      (resp.Messages ?? []).map(msg => processMessage(ctx, msg))
    );
  }
}

async function processMessage(ctx: ServiceContext, msg: SQSMessage) {
  const { agentId } = JSON.parse(msg.Body!);

  // Ack immediately — inbox is the source of truth, not SQS
  await sqs.deleteMessage({ QueueUrl: QUEUE_URL, ReceiptHandle: msg.ReceiptHandle! });

  // Per-agent serialization: if already processing, the active loop will drain new items
  if (activeAgents.has(agentId)) return;

  activeAgents.add(agentId);
  try {
    while (true) {
      const items = await drainInbox(ctx, agentId);
      if (items.length === 0) break;

      await markRead(ctx, items);
      await routeBatch(ctx, agentId, items);
    }
  } finally {
    activeAgents.delete(agentId);
  }
}
```

The `while (true)` loop is the key: after processing a batch, the consumer checks for more work that arrived during processing. It only exits when the inbox is empty. This means:

- Agent is idle, one message arrives: processed immediately
- Agent is busy, 10 messages arrive: all 10 are batched into the next drain
- SQS doorbells that arrive while the agent is active are no-ops (`activeAgents` check)

### Batch Routing

The consumer splits the batch into two categories:

- **Main-lane items** (`user_message`, `user_task_message`, `user_notification_reply`) — conversational. Written to the main-thread agent log and handled by `runMainLane()`. Multiple user messages are batched into a single turn — the agent sees all of them in its conversation history and responds holistically, like receiving multiple requirements at once.
- **Task-lane items** (`run_task`, `scheduled_job`, `agent_self_followup`, `core_memory_review`) — dispatched work. Each goes directly to `runTaskLane()` with its own task context, tools, and sub-thread. These run sequentially within the batch, not concurrently, preserving per-agent serialization.

```typescript
async function routeBatch(ctx: ServiceContext, agentId: string, items: InboxItem[]) {
  const mainLaneItems = items.filter(i =>
    i.type === "user_message" || i.type === "user_notification_reply"
  );
  const taskLaneItems = items.filter(i =>
    i.type === "run_task" || i.type === "scheduled_job" || i.type === "agent_self_followup"
  );

  // Main lane: batch all conversational items into one turn.
  // The agent sees everything and decides how to respond.
  if (mainLaneItems.length > 0) {
    for (const item of mainLaneItems) {
      switch (item.type) {
        case "user_message":
          await writeAgentLog(ctx, { agentId, role: "USER", content: item.payload.content });
          break;
        case "user_notification_reply":
          await writeAgentLog(ctx, {
            agentId,
            role: "SYSTEM",
            content: formatNotificationReply(item),
          });
          break;
      }
    }
    await runMainLane(ctx, agentId);
  }

  // Task lane: dispatch each task-scoped item with its own context and tools.
  for (const item of taskLaneItems) {
    switch (item.type) {
      case "run_task":
        await runTaskLane(ctx, item.payload.taskId, item.payload.prompt);
        break;
      case "scheduled_job":
        await handleScheduledJob(ctx, agentId, item);
        break;
      case "agent_self_followup":
        await runTaskLane(ctx, item.payload.taskId, item.payload.prompt);
        break;
    }
  }
}
```

Main lane runs first so the agent can respond to the user before working through queued tasks. Task-lane items run sequentially after — each gets its own `runTaskLane()` call with task-specific conversation history, system prompt, and tools (`updateTaskMessage`, `writeFile`, `runCommand`, etc.).

User messages are written to the agent log at processing time, not when they arrive. This keeps the log cleanly ordered — no interleaving with agent output from a concurrent turn. The UI can still show user messages immediately via optimistic rendering from the mutation response.

### Task Anchors in the Main Lane

When task-lane items create or resume tasks, the consumer writes a SYSTEM log entry to the main-lane thread so the UI can render the task sub-thread at the right position:

```typescript
async function handleScheduledJob(ctx: ServiceContext, agentId: string, item: InboxItem) {
  // Dedup via TransactWrite (existing pattern)
  const taskId = await createJobTask(ctx, item);
  if (!taskId) return; // already triggered

  // Anchor in main-lane log — UI attaches the sub-thread here
  await writeAgentLog(ctx, {
    agentId,
    role: "SYSTEM",
    content: `Scheduled task started: ${job.name}`,
    metadata: { taskId },
  });

  await runTaskLane(ctx, taskId, job.description);
}
```

These anchor entries are purely for the UI. The agent's system prompt should instruct it to ignore them:

> SYSTEM log entries prefixed with "Scheduled task started:" are UI anchors for background tasks. Do not respond to or reference them in conversation.

For `run_task` (delegation), the anchor is the `delegateTask` tool call itself — no extra log entry needed. For `agent_self_followup`, the anchor already exists from when the task was originally created.

### Notification Reply Formatting

When the agent requested approval and the user replied, the system message needs enough context for the agent to act on it:

```typescript
function formatNotificationReply(item: InboxItem & { type: "user_notification_reply" }): string {
  // Load the original notification to provide context
  // Returns something like:
  // "The user responded to your approval request.
  //  Request: 'Can I send the counter-offer email to the dealer?'
  //  User selected: 'Yes, send it'"
}
```

The agent sees this in its main-lane conversation history and can decide to kick off a task, respond to the user, or take whatever action is appropriate.

## Producers

### User sends a message

```
sendMessage mutation
  → write to inbox: { type: "user_message", payload: { content } }
  → ring doorbell
  → return immediately (UI shows message optimistically)
```

The UI shows the message optimistically from the mutation response.

### Scheduled job (cron)

```
User creates/updates AgentJob
  → create EventBridge Schedule (cron expression, target = Lambda)
  → Lambda fires on schedule
  → writes to inbox: { type: "scheduled_job", payload: { jobId, triggerTimeMs } }
  → rings doorbell
```

EventBridge fires exactly on time. CronJobTrigger dedup (TransactWrite) runs inside the consumer's `handleScheduledJob()`.

### Agent self-follow-up (delayed self-wake)

```
Agent calls createFollowUp({ delayMs, prompt })
  → create one-shot EventBridge Schedule at now + delayMs
  → schedule target = Lambda
  → Lambda fires at scheduled time
  → writes to inbox: { type: "agent_self_followup", payload: { taskId, prompt } }
  → rings doorbell
  → schedule auto-deletes (ActionAfterCompletion: DELETE)
```

Timing is precise — the schedule fires at exactly the requested time.

### User replies to notification

```
resolveNotification mutation
  → update notification status in DDB
  → write to inbox: { type: "user_notification_reply", payload: { notificationId, actionId } }
  → ring doorbell
```

The agent receives the reply as a queued inbox item and can act on it in its next turn.

### Task delegation

Task delegation is special: the agent is *currently running* and wants to spawn background work. This shouldn't go through the inbox — that would serialize it behind the current turn, blocking the conversation until the delegated task finishes.

Instead, `delegateTask` enqueues to a **different agent's inbox** (if delegating to another agent) or, for self-delegation, writes the inbox item but the consumer handles it after the current turn naturally exits:

```
Agent calls delegateTask tool
  → create Task entity (status: PENDING)
  → write to inbox: { type: "run_task", payload: { taskId, prompt } }
  → ring doorbell
  → current turn continues and finishes normally
  → consumer drain loop picks up run_task, dispatches via runTaskLane()
```

This works because the `run_task` item lands in the inbox while the current turn is still active. When the turn ends, the drain loop finds it and processes it next. The task runs immediately after the current work — no user-facing delay, and serialization is preserved.

## Recovery: The Sweeper

A single EventBridge rule runs every 3 minutes. It queries for stale inbox items and re-rings doorbells for any agent that has unprocessed work. Redundant doorbells are no-ops.

```typescript
// EventBridge rule → Lambda (or server endpoint)
async function sweepStaleInbox() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // GSI2: all unread items older than 10 minutes
  const stale = await ddb.query({
    IndexName: "GSI2",
    KeyConditionExpression: "gsi2pk = :pk AND gsi2sk < :cutoff",
    ExpressionAttributeValues: {
      ":pk": "INBOX_UNREAD",
      ":cutoff": cutoff,
    },
  });

  const agentIds = [...new Set(stale.Items.map(i => i.agentId))];

  await Promise.all(
    agentIds.map(agentId =>
      sqs.sendMessage({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ agentId }),
      })
    )
  );
}
```

This handles all failure modes:

| Scenario | Recovery |
|----------|----------|
| Server crash mid-processing | Sweeper finds stale items in ~3 min, re-rings |
| Deploy/restart | Same — sweeper catches it |
| SQS doorbell lost | Sweeper re-rings |
| Agent LLM call hangs forever | Items age past 10 min, sweeper re-rings |
| Healthy agent just slow | Items are < 10 min old, sweeper ignores them |
| Redundant doorbell | `activeAgents.has()` check, no-op |

The 10-minute threshold gives healthy agents room to work. 3-minute sweep interval means worst-case recovery is ~13 minutes. Both numbers are tunable.

## Infrastructure

| Component | Purpose |
|---|---|
| SQS standard queue | Doorbell — wake up consumers |
| SQS dead-letter queue | Failed messages after max retries |
| EventBridge Scheduler | Cron schedules (AgentJob) and one-shot delays (follow-ups) |
| EventBridge rule (3-min) | Sweeper for stale inbox items |
| Lambda (sweeper) | Queries GSI2, re-rings doorbells |
| Lambda (schedule target) | EventBridge schedule fires → writes inbox item + rings doorbell |

## Key Components

| Component | Role |
|---|---|
| `runTaskLane()` / `runMainLane()` | Core agent execution — called by the consumer after draining the inbox |
| `AgentLog` | Append-only conversation record for both main thread and task sub-threads |
| `Task` entity and lifecycle | Discrete units of work with status tracking |
| `AgentJob` entity | Scheduled triggers — `cronExpression` drives an EventBridge Schedule |
| CronJobTrigger dedup (TransactWrite) | Inside the consumer's `handleScheduledJob()` |
| GraphQL subscriptions / PubSub | Powers real-time UI updates |

## Concurrency

- `MaxNumberOfMessages` on the SQS receive call controls how many agents process in parallel (e.g., 10)
- Per-agent serialization is enforced by `activeAgents` set — one processing loop per agent at a time
- Within a batch, main-lane items (user messages, notification replies) are batched into one `runMainLane()` turn; task-lane items (`run_task`, `scheduled_job`, `agent_self_followup`) each get their own `runTaskLane()` call, run sequentially
- Main lane runs first so the user gets a response before background tasks execute
- For multi-instance deployments, replace `activeAgents` with a DDB conditional write (distributed lock)

## Serialization Trade-offs

### Main lane is serialized with task lanes

All work is serialized per-agent: if a task is running, user messages wait in the inbox until the task's current turn finishes. The agent processes one thing at a time, in order. When the task turn completes, the consumer drains the inbox, finds the user messages, writes them to the agent log, and runs a main-lane turn.

The trade-off is slightly delayed responses during active tasks, in exchange for clean serialization, no race conditions, and predictable agent behavior. To restore concurrent main-lane access in the future, the inbox could be partitioned by lane (main vs task) with separate drain loops.

## Open Questions

### Message ordering in the UI

User messages are written to the agent log when the consumer processes them, not when the user sends them. The UI shows messages optimistically from the mutation response. Need to ensure the UI doesn't show duplicate messages (once from optimistic update, once from the subscription when the log entry is created).

### Multi-instance locking

The `activeAgents` in-memory set works for a single server. For horizontal scaling, need a distributed lock. Options:
- DDB conditional write with TTL
- SQS FIFO with MessageGroupId (but loses batching benefits)

Single instance is fine for now.

### Inbox item TTL

Read inbox items should be cleaned up. Options:
- DDB TTL — set a `ttl` attribute when marking `isRead = true` (e.g., 7 days)
- Delete immediately after processing

DDB TTL is simpler and provides an audit trail.
