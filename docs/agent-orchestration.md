# Agent Orchestration

How agents execute work, manage long-running tasks, and resume after waiting.

## Concepts

```
Agent
 ├── AgentLog (main conversation thread)
 ├── Task (discrete unit of work)
 │    ├── AgentLog (task sub-thread)
 │    └── TaskFollowUp (deferred wake-up)
 └── AgentJob (scheduled recurring trigger — already exists)
```

**Agent** — A configured AI persona (Clawd, etc.). Has a free main lane: it can always accept new user commands or job triggers without being blocked by in-progress tasks.

**AgentLog** — The concrete chat log rendered in the UX. Every message, tool call, status update, and decision is an AgentLog entry. Entries are scoped to either the agent's main thread or to a specific Task. This is the source of truth for what happened and the context window for resuming work.

**Task** — A discrete unit of work spawned by an agent. Has its own lane (independent of the main lane). Tasks have a lifecycle and generate their own AgentLog entries that render as a sub-thread branching off the main conversation at the point the task was created.

**TaskFollowUp** — A deferred wake-up record. When an agent working on a task needs to wait (e.g., "email sent, check back in 15 minutes"), it writes a TaskFollowUp dated in the future. A cron job reads this table every 60 seconds and dispatches an agent to continue the task when a follow-up comes due.

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
| `statusReason` | string? | Why the task is in its current state (e.g., "Waiting for dealer email reply") |
| `createdAt` | string (ISO 8601) | When the task was spawned |
| `updatedAt` | string (ISO 8601) | Last status change |
| `completedAt` | string? (ISO 8601) | When the task reached a terminal state |
| `originJobId` | string? | If this task was triggered by an AgentJob |

**DynamoDB key pattern:**

| Key | Value |
|-----|-------|
| PK | `TASK` |
| SK | `TASK#<id>` |
| GSI1PK | `TASK_AGENT#<agentId>` |
| GSI1SK | `<createdAt>` |

### TaskFollowUp

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique follow-up ID |
| `taskId` | string | The task this follow-up belongs to |
| `agentId` | string | The agent to dispatch |
| `scheduledAt` | string (ISO 8601) | When this follow-up should fire |
| `prompt` | string | Context/instructions for the agent when it resumes (e.g., "Check inbox for dealer reply. If replied, counter-offer. If not, wait another 15 min.") |
| `active` | boolean | Whether this follow-up is still pending. Set to `false` when the agent picks it up or when cancelled. |
| `createdAt` | string (ISO 8601) | When this follow-up was written |

**DynamoDB key pattern:**

| Key | Value |
|-----|-------|
| PK | `TASK_FOLLOW_UP` |
| SK | `TASK_FOLLOW_UP#<id>` |
| GSI1PK | `FOLLOWUP_ACTIVE` (only for active=true, enables efficient cron scan) |
| GSI1SK | `<scheduledAt>` |

The cron job queries: `GSI1PK = FOLLOWUP_ACTIVE` where `scheduledAt <= now`, sorted ascending.

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
    ├── Writes TaskFollowUp (scheduledAt: now + 15min, active: true)
    ├── Updates Task (status: waiting, statusReason: "Waiting for dealer reply")
    │
    ▼
Agent turn ENDS — main lane is free
```

### Cron Follow-Up Dispatch

```
Every 60 seconds, cron job runs:
    │
    ▼
Query GSI1: FOLLOWUP_ACTIVE where scheduledAt <= now
    │
    ▼
For each due follow-up:
    ├── Mark follow-up active=false (prevents duplicate dispatch)
    ├── Load Task context
    ├── Load AgentLog for the task (conversation history)
    ├── Dispatch agent with:
    │     - Task ID
    │     - Follow-up prompt
    │     - AgentLog history as context
    │
    ▼
Agent resumes task work
    ├── Checks email → no reply?
    │     ├── AgentLog: "No reply yet. Will check again in 15 minutes."
    │     ├── Writes new TaskFollowUp (scheduledAt: now + 15min)
    │     └── Turn ends
    │
    ├── Checks email → reply found!
    │     ├── AgentLog: "Dealer countered at $28k. Researching comparables..."
    │     ├── Does more work (web search, compose counter-offer, send email)
    │     ├── Writes another TaskFollowUp for the next check
    │     └── Turn ends
    │
    └── Task complete?
          ├── Updates Task (status: completed)
          ├── AgentLog: "Negotiation complete. Final price: $26,500."
          └── No more follow-ups written — task is done
```

### Service Restart Recovery

```
On server startup:
    │
    ▼
Query all Tasks where status IN (running, waiting, pending)
    │
    ▼
For each incomplete task:
    ├── If status = waiting AND has active TaskFollowUp:
    │     └── Follow-up timer will handle it naturally (no action needed)
    │
    ├── If status = waiting AND no active TaskFollowUp:
    │     └── Create a TaskFollowUp for now (immediate dispatch)
    │
    ├── If status = running (was mid-execution when server died):
    │     └── Create a TaskFollowUp for now with prompt:
    │         "Task was interrupted. Review AgentLog and resume."
    │
    └── If status = pending (never started):
          └── Dispatch agent to begin the task
```

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

The main lane stays free. The user asks about weather while the negotiation task is in `waiting` state — no conflict.

## Relationship to Existing Entities

| Existing | Role in new system |
|----------|-------------------|
| **Agent** | Unchanged. The AI persona. Tasks and logs reference `agentId`. |
| **AgentJob** | Scheduled trigger. May spawn Tasks when it runs. `originJobId` on Task links back. |
| **Status** | Remains as the public "finished work" summary. A completed Task may produce a Status as its final output. |

## Key Design Decisions

1. **AgentLog is append-only.** Never mutate or delete entries. This is both the UX conversation and the agent's memory.

2. **TaskFollowUp is intentionally simple.** It's a one-shot deferred wake-up, not a full cron system. For recurring schedules, AgentJob already exists. TaskFollowUp handles the "check back in N minutes" pattern within a task.

3. **Follow-ups are self-chaining.** The agent decides each time whether to write another follow-up or to complete/abandon the task. There is no pre-set retry limit in the data model — the agent's prompt and reasoning control when to stop.

4. **The cron marks follow-ups inactive before dispatching.** This prevents duplicate dispatch if the cron fires again before the agent finishes. If the agent crashes mid-execution, the restart recovery path handles it.

5. **Tasks should finish or be abandoned before the agent takes new scheduled work.** The agent's main lane is always free for user commands, but when an AgentJob fires, it should check if its agent already has an active task and either wait or queue.

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

### What the SDK does NOT replace

The entire orchestration layer (Task, TaskFollowUp, cron dispatch, AgentLog persistence, restart recovery) sits above the SDK. The SDK answers "given a prompt and tools, run until the LLM stops calling tools." Our system answers "when to start a turn, what context to feed it, and what to do when it finishes."

### What we skip

The React hooks (`useChat`, `useCompletion`) and Next.js route handlers are irrelevant — we have our own apps and GraphQL server. Only the core `ai` package and provider packages are used.

## Open Questions

### AgentJob → Task concurrency

When an AgentJob fires and spawns a new Task, there may already be an older Task from the same AgentJob still in progress (e.g., the previous run is in `waiting` state, polling for an email reply). The new Task can still be created, but it should not begin execution until the older sibling completes. Two possible approaches:

1. **FollowUp-based:** The new Task immediately writes a TaskFollowUp that polls for the older Task's completion before starting real work.
2. **Event-based:** The new Task listens for a completion event from the older Task, avoiding polling entirely.

Option 2 is cleaner but requires an event/notification mechanism we don't have yet. Will tackle this when we build the dispatch layer.
