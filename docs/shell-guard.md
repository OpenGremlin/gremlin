# Shell Guard

Command safety layer for agent sandbox execution. Evaluates shell commands against safe-bin presets and per-agent allowlists, requesting user approval for unrecognized commands. The approval flow is fully opaque to the agent.

## Motivation

Agents execute arbitrary shell commands in isolated EC2 sandboxes. While the sandbox provides infrastructure-level isolation, there's no application-level gate on what commands an agent can run. Shell Guard adds a policy layer that:

- Auto-approves known-safe commands (text processing, dev tooling)
- Flags unrecognized or dangerous commands for user approval
- Persists allow-always decisions so repeated commands don't re-prompt
- Keeps the entire approval flow invisible to the agent

## Architecture

```
Agent calls runCommand("ffmpeg -i video.mp4 ...")
  │
  ▼
┌─────────────────────────────────────────────────┐
│  runCommandTool execute()                       │
│                                                 │
│  1. guardCommand() evaluates the command        │
│     ├─ dangerous pattern? → create approval     │
│     ├─ in safe bins? → execute immediately      │
│     ├─ in allowlist? → execute immediately      │
│     └─ unknown? → create approval               │
│                                                 │
│  2a. If allowed → execCommand() → return result │
│  2b. If approval needed → return with           │
│       commandApprovalId, turn ends              │
└─────────────────────────────────────────────────┘
```

## Safe-Bin Presets

Commands are organized by risk tier. The default preset is `sandbox` which includes all three tiers.

### Read (always safe)

`awk`, `basename`, `cat`, `cut`, `date`, `diff`, `dirname`, `du`, `echo`, `env`, `file`, `find`, `grep`, `head`, `jq`, `less`, `ls`, `printf`, `realpath`, `sed`, `sort`, `stat`, `tail`, `tr`, `uniq`, `wc`, `which`, `whoami`, `xargs`

### Dev (safe in a sandbox)

`bun`, `cargo`, `cmake`, `esbuild`, `git`, `go`, `make`, `node`, `npm`, `npx`, `pip`, `pip3`, `pnpm`, `python`, `python3`, `rustc`, `tsc`, `vite`, `yarn`

### Network (safe in a sandbox, may want approval outside one)

`curl`, `scp`, `ssh`, `wget`

### Dangerous patterns (always trigger approval)

`rm -rf /`, `rm -rf /*`, `mkfs`, `dd if=`, `> /dev/sd`, `:(){ :|:& };:`, `chmod -R 777 /`

### Presets

| Preset | Includes |
|--------|----------|
| `sandbox` | Read + Dev + Network |
| `restricted` | Read only |

## Allowlist

Per-agent allowlists store glob patterns for executables that have been approved. The `AllowlistProvider` interface abstracts storage:

```typescript
interface AllowlistProvider {
  getEntries(agentId: string): Promise<AllowlistEntry[]>;
  addEntry(agentId: string, entry: AllowlistEntry): Promise<void>;
  removeEntry(agentId: string, pattern: string): Promise<void>;
}
```

The provider implementation in the server merges global and per-agent entries. Shell Guard evaluates against the merged list without knowledge of the distinction.

## Approval Flow

The approval flow is designed to be completely opaque to the agent. The agent never sees an approval request, never knows one happened, and never receives a notification reply. From the agent's perspective, commands either succeed or fail.

### Happy path (command is safe)

```
Agent calls runCommand("git status")
  → guardCommand() checks safe bins → "git" is in SAFE_BINS_DEV
  → execCommand() runs in sandbox
  → agent receives { output, exitCode }
  → agent has no idea Shell Guard exists
```

### Approval needed

```
Agent calls runCommand("ffmpeg -i video.mp4 output.gif")
  │
  ▼
guardCommand()
  → "ffmpeg" not in safe bins or allowlist
  → create CommandApproval entity (status: PENDING, command stashed)
  → return { commandApprovalId }
  │
  ▼
runCommandTool returns { commandApprovalId, status: "pending_approval" }
  → eager logger attaches commandApprovalId to the runCommand log entry
  → turn ends
  │
  ▼
Frontend sees log entry with commandApprovalId
  → renders approval UI inline on the runCommand tool call
  → user sees: "ffmpeg -i video.mp4 output.gif" with Allow Once / Allow Always / Deny buttons
  │
  ▼ (user clicks Allow Always)
  │
resolveCommandApproval mutation
  → updates CommandApproval entity (status: RESOLVED, decision: allow-always)
  → adds "ffmpeg" to agent's allowlist via AllowlistProvider
  → executes the stashed command in the sandbox
  → updates the runCommand log entry in-place with actual toolResult
  → publishes updated log entry via PubSub (frontend refreshes)
  → rings doorbell to wake the agent
  │
  ▼
Consumer picks up doorbell
  → drains inbox (may be empty, may have new user messages)
  → rebuilds agent message history from log
  → agent sees a normal runCommand result: { output, exitCode }
  → agent continues, unaware approval happened
```

### Denial

Same flow, but:
- Log entry's `toolResult` is updated to `"This command is not allowed."`
- No allowlist entry is added
- Agent sees a failed command and may try a different approach

### Guarding against new turns during pending approval

When a doorbell arrives for a task lane, the consumer calls `hasPendingApproval(ctx, agentId, taskId)` which queries DynamoDB for PENDING CommandApproval records. If one exists, the consumer breaks out of the drain loop. Items remain marked as read — when the approval resolves, `resolveCommandApproval` rings a new doorbell and the consumer processes them.

The `runAgentTurn` function also halts when a command approval is created during a turn. A `pendingCommandApproval` flag is set in `onStepFinish` when a `runCommand` tool result contains `commandApprovalId`, and `stopWhen` checks this flag to end the `generateText` loop.

## CommandApproval Entity

```
pk: COMMAND_APPROVAL
sk: COMMAND_APPROVAL#<id>
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique approval ID |
| `agentId` | string | Agent that triggered the approval |
| `taskId` | string | Task context |
| `command` | string | The full shell command |
| `reason` | string | Why it was flagged |
| `status` | enum | `PENDING` / `RESOLVED` |
| `decision` | string? | `allow-once` / `allow-always` / `deny` (set on resolution) |
| `logEntryId` | string | The agent log entry this approval is attached to |
| `createdAt` | string | ISO 8601 |
| `resolvedAt` | string? | ISO 8601 |

## Sandbox Session Lifecycle

No special handling is needed for sandbox sessions during approval. If the sandbox times out while waiting for approval, the session will be closed by the idle cleanup timer. When the agent's next turn runs after approval, `runCommand` will return "Sandbox is not online. Call ensureSandbox first to boot it up." The agent will call `ensureSandbox` and re-execute the command naturally.

## Integration Points

### Service registration

`shellGuardService` is registered in `packages/lib/src/services/index.ts` as `ctx.services.shellGuard`.

### sandboxTools.ts

`runCommandTool` accepts an optional `shellGuard` parameter with `AllowlistProvider`. When provided, every command is evaluated via `guardCommand()` before execution. If approval is needed, a `CommandApproval` entity is created and the tool returns `{ status: "pending_approval", commandApprovalId }` — the turn then halts.

### agentLaneContext.ts

`buildTaskTools` passes the shell guard providers into `runCommandTool` when the agent has sandbox enabled.

### Agent log

The `AgentLog` entity has an optional `commandApprovalId` field. When present, the frontend renders the approval UI inline on the tool call card.

### GraphQL

```graphql
type CommandApproval {
  id: ID!
  agent: Agent!
  command: String!
  reason: String!
  status: CommandApprovalStatus!
  decision: String
  createdAt: String!
  resolvedAt: String
}

enum CommandApprovalStatus {
  PENDING
  RESOLVED
}

extend type AgentLog {
  commandApproval: CommandApproval
}

extend type Mutation {
  resolveCommandApproval(
    id: ID!
    decision: CommandApprovalDecision!
  ): CommandApproval
}

enum CommandApprovalDecision {
  ALLOW_ONCE
  ALLOW_ALWAYS
  DENY
}
```

### Frontend rendering

The chat UI checks each `runCommand` tool call log entry for a `commandApproval` field. When present:

- **PENDING**: render the command text with Allow Once / Allow Always / Deny buttons
- **RESOLVED (allowed)**: render normally (the toolResult has been updated in-place)
- **RESOLVED (denied)**: render with a "denied" indicator

## File Structure

```
packages/lib/src/services/shellGuard/
  index.ts                  # Barrel export + shellGuardService
  types.ts                  # AllowlistEntry, AllowlistProvider interfaces
  presets.ts                # SAFE_BINS_READ, SAFE_BINS_DEV, SAFE_BINS_NETWORK, PRESETS
  shellParse.ts             # Shell command parsing (chains, pipes, heredocs, wrappers)
  guardCommand.ts           # Pure evaluation — returns GuardVerdict (needsApproval + reason)
  createCommandApproval.ts  # Create PENDING CommandApproval in DDB
  getCommandApproval.ts     # Load a single approval by ID
  resolveCommandApproval.ts # Resolve approval: execute command, update log, ring doorbell
  hasPendingApproval.ts     # Check if a pending approval exists for agent+task

packages/lib/src/resources/ddb/schema/
  commandApproval.ts        # CommandApproval DynamoDB entity

apps/server/src/gql/schema/CommandApproval/
  typeDefs.ts               # GraphQL types + resolveCommandApproval mutation
  resolvers.ts              # Mutation resolver

apps/mobile/src/shared/LogEntryView/
  CommandApprovalCard.tsx    # Inline approval UI on RunCommand tool cards
```
