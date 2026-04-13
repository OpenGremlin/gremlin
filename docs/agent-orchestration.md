# Agent Orchestration

How agents execute work, manage long-running tasks, and resume after waiting.

## Concepts

```
Agent
 ├── AgentLog (main conversation thread)
 ├── Task (discrete unit of work)
 │    └── AgentLog (task sub-thread)
 └── AgentJob (scheduled recurring trigger)
```

**Agent** — A configured AI persona. All work is serialized per-agent through the inbox queue (see `agent-inbox-queue.md`).

**AgentLog** — The concrete chat log rendered in the UX. Every message, tool call, status update, and decision is an AgentLog entry. Entries are scoped to either the agent's main thread or to a specific Task. This is the source of truth for what happened and the context window for resuming work.

**Task** — A discrete unit of work spawned by an agent. Has its own lane with its own AgentLog sub-thread branching off the main conversation at the point the task was created.


## Data Model

### AgentLog

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique log entry ID |
| `agentId` | string | Which agent produced this entry |
| `taskId` | string? | If set, this entry belongs to a task sub-thread. If null, it belongs to the agent's main thread. |
| `role` | `"agent" \| "user" \| "system" \| "tool"` | Who produced this message |
| `content` | string | The message content (text, markdown, structured JSON) |
| `createdAt` | string (ISO 8601) | When this entry was created |

**DynamoDB key pattern:**

| Key | Value |
|-----|-------|
| PK | `AGENT_LOG` |
| SK | `AGENT_LOG#<id>` |
| GSI1PK | `LOG_AGENT#<agentId>` (main thread) or `LOG_TASK#<taskId>` (task thread) |
| GSI1SK | `<createdAt>` |

Query the main thread: `GSI1PK = LOG_AGENT#<agentId>`, sorted by `createdAt`.
Query a task sub-thread: `GSI1PK = LOG_TASK#<taskId>`, sorted by `createdAt`.

### Task

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task ID |
| `agentId` | string | The agent executing this task |
| `title` | string | Human-readable task name (e.g., "Negotiate car price") |
| `status` | `"pending" \| "running" \| "waiting" \| "completed" \| "failed" \| "abandoned"` | Current lifecycle state |
| `message` | string? | Short human-readable status update (e.g., "Waiting for dealer email reply") |
| `createdAt` | string (ISO 8601) | When the task was spawned |
| `updatedAt` | string (ISO 8601) | Last status change |
| `originJobId` | string? | If this task was triggered by an AgentJob |

**DynamoDB key pattern:**

| Key | Value |
|-----|-------|
| PK | `TASK` |
| SK | `TASK#<id>` |
| GSI1PK | `TASK_AGENT#<agentId>` |
| GSI1SK | `<createdAt>` |

## Lifecycle

### Task Execution Flow

```
User says "negotiate this car price"
    │
    ▼
Agent main lane receives command
    │
    ▼
Agent spawns Task (status: pending)
    ├── AgentLog entry in main thread: "Starting task: Negotiate car price"
    │   (this is the anchor point for the sub-thread in the UX)
    │
    ▼
Agent begins task work (status: running)
    ├── AgentLog entries in task thread: research, compose email, etc.
    │
    ▼
Agent sends email, needs to wait
    ├── AgentLog in task thread: "Email sent to dealer. Will check for reply in 15 minutes."
    ├── Creates one-shot EventBridge Schedule (now + 15min)
    ├── Updates Task (status: waiting, message: "Waiting for dealer reply")
    │
    ▼
Agent turn ENDS — inbox is free for next work
```

### Service Restart Recovery

Recovery is handled by the inbox sweeper (see `agent-inbox-queue.md`). A periodic EventBridge rule queries for stale unread inbox items and re-rings SQS doorbells for any agent with unprocessed work. This covers server crashes, deploy restarts, and lost SQS messages without polling DynamoDB for tasks.

## UX Rendering

The AgentLog drives the conversation UI:

```
┌─────────────────────────────────────────┐
│  Main Thread (agentId, no taskId)       │
│                                         │
│  [Agent] Good morning! Checking news... │
│  [Agent] Here's your briefing: ...      │
│  [User]  Negotiate a price on this car  │
│  [Agent] Starting task: Negotiate car   │ ◄── task anchor
│    │                                    │
│    ├── Task Sub-Thread (taskId: abc)    │
│    │  [Agent] Researching fair price... │
│    │  [Tool]  Web search results: ...   │
│    │  [Agent] Sending initial offer...  │
│    │  [Agent] ⏳ Checking back in 15min │
│    │  [Agent] No reply yet. +15min...   │
│    │  [Agent] Dealer replied! $28k...   │
│    │  [Agent] Counter-offered $26k...   │
│    │  [Agent] ✓ Deal closed at $26,500  │
│    │                                    │
│  [User]  What's the weather tomorrow?   │
│  [Agent] Tomorrow will be sunny, 72°F   │
└─────────────────────────────────────────┘
```

User messages are queued in the inbox and processed after the current agent turn completes. See `agent-inbox-queue.md` for details on per-agent serialization.

## Related Entities

| Entity | Role |
|--------|------|
| **Agent** | The AI persona. Tasks and logs reference `agentId`. |
| **AgentJob** | Scheduled trigger. Spawns Tasks when it runs. `originJobId` on Task links back. |

## Key Design Decisions

1. **AgentLog is append-only.** Never mutate or delete entries. This is both the UX conversation and the agent's memory.

2. **Follow-ups use EventBridge one-shot schedules.** Not a polling system — each deferred wake-up is a precise one-shot schedule that auto-deletes after firing (`ActionAfterCompletion: DELETE`). For recurring schedules, AgentJob + EventBridge cron already exists.

3. **Follow-ups are self-chaining.** The agent decides each time whether to create another follow-up schedule or to complete/abandon the task. There is no pre-set retry limit — the agent's prompt and reasoning control when to stop.

4. **All work is serialized per-agent through the inbox.** See `agent-inbox-queue.md`. The inbox + SQS doorbell architecture ensures one processing loop per agent at a time.

## AI SDK

Agent turns are executed using [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` package + provider packages like `@ai-sdk/anthropic`). The SDK handles the inner loop of a single agent turn; our orchestration layer handles when and why to trigger turns.

```
Orchestration layer (Task, TaskFollowUp, cron dispatch)
    │
    ▼  "run a turn for this task with this context"
Vercel AI SDK (generateText/streamText + tools + maxSteps)
    │
    ▼  "which model?"
Provider (@ai-sdk/anthropic, @ai-sdk/openai, etc.)
```

### What the SDK provides

- **Model abstraction** — swap providers per agent or per task without changing calling code. Use a cheap model for routine follow-up checks, a capable model for complex reasoning.
- **Tool calling with Zod schemas** — define tools (`searchWeb`, `sendEmail`, `checkInbox`) with typed inputs/outputs. The SDK handles marshalling.
- **`maxSteps` agent loop** — the LLM → tool call → result → LLM cycle within a single turn is handled automatically. No custom loop needed.
- **Streaming** — `streamText` provides token-by-token output to write AgentLog entries in real time.
- **Provider registry** — configure providers once, reference by string ID. Each Agent entity can store a model preference.

### What the SDK does NOT cover

The entire orchestration layer (Task, inbox queue, cron dispatch, AgentLog persistence, restart recovery) sits above the SDK. The SDK answers "given a prompt and tools, run until the LLM stops calling tools." Our system answers "when to start a turn, what context to feed it, and what to do when it finishes."

### What we don't use

The React hooks (`useChat`, `useCompletion`) and Next.js route handlers are not used — we have our own apps and GraphQL server. Only the core `ai` package and provider packages are used.

## Open Questions

### AgentJob → Task concurrency

When an AgentJob fires and spawns a new Task, there may already be an older Task from the same AgentJob still in progress. Per-agent serialization through the inbox naturally queues the new task behind the current one — it doesn't start until the agent's current work drains.
