# Shell Guard

Command safety layer for agent sandbox execution. Evaluates shell commands against safe-bin presets and per-agent allowlists, requesting user approval for unrecognized commands. The approval flow is fully opaque to the agent.

## Motivation

Agents execute arbitrary shell commands in isolated EC2 sandboxes. While the sandbox provides infrastructure-level isolation, there's no application-level gate on what commands an agent can run. Shell Guard adds a policy layer that:

- Auto-approves known-safe commands (text processing, dev tooling, shell builtins)
- Flags unrecognized or dangerous commands for user approval
- Returns parse errors directly to the agent so it can rewrite the command
- Persists allow-always decisions so repeated commands don't re-prompt
- Keeps the entire approval flow invisible to the agent

## Architecture

```
Agent calls runCommand("ffmpeg -i video.mp4 ...")
  │
  ▼
┌──────────────────────────────────────────────────────┐
│  runCommandTool execute()                            │
│                                                      │
│  1. guardCommand() evaluates the command             │
│     ├─ dangerous pattern? → create approval          │
│     ├─ unparseable ($(), `) → return error to agent  │
│     ├─ in safe bins? → execute immediately           │
│     ├─ in allowlist? → execute immediately           │
│     └─ unknown? → create approval                    │
│                                                      │
│  2a. If allowed → execCommand() → return result      │
│  2b. If approval needed → return with                │
│       commandApprovalId, turn ends                   │
│  2c. If invalid → return error, agent continues      │
└──────────────────────────────────────────────────────┘
```

## Guard Verdicts

`guardCommand()` returns a `GuardVerdict` discriminated union:

| Status | Meaning | Agent sees |
|--------|---------|------------|
| `allowed` | Command passes all checks | Normal execution result |
| `approval_required` | Unknown executable or dangerous pattern | Nothing (turn ends, user prompted) |
| `invalid` | Command uses unsupported syntax (`$()`, backticks) | Error message explaining what to fix |

## Safe-Bin Presets

Commands are organized by risk tier. The default preset is `sandbox` which includes all tiers.

### Builtins (shell builtins, always safe)

`cd`, `exit`, `export`, `false`, `pwd`, `set`, `source`, `test`, `true`, `type`, `ulimit`, `umask`, `unset`

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
| `sandbox` | Builtins + Read + Dev + Network |
| `restricted` | Builtins + Read only |

## Shell Parsing

The parser is tuned for sandbox use. Since the sandbox itself is the safety boundary, the parser is permissive about shell syntax and only rejects constructs that hide executable identity.

### Allowed syntax

- Chain operators: `&&`, `||`, `;`
- Pipes: `|`
- Redirections: `>`, `>>`, `<`
- Heredocs: `<<EOF`, `<<-EOF`, `<<'EOF'`
- Subshells: `(`, `)`
- Background: `&`
- Quoted strings (single and double)
- Escaped characters

### Rejected syntax (returned as error to agent)

- Command substitution: `$()` — hides which executable runs
- Backticks: `` ` `` — same as `$()`

When the parser rejects a command, the agent gets an error like "Command could not be parsed: unsupported shell token: `$()``. Rewrite the command to avoid unsupported syntax." The agent can fix and retry without user involvement.

### Wrapper unwrapping

The parser unwraps transparent wrappers to find the real executable:

| Wrapper | Handling |
|---------|----------|
| `env`, `nice`, `nohup`, `stdbuf`, `timeout` | Unwrapped — the real command follows |
| `sudo`, `doas`, `chrt`, `ionice`, `setsid`, `taskset` | Flagged as the executable (triggers approval) |

Example: `env FOO=bar timeout 30 nice -n 5 ffmpeg ...` → executable is `ffmpeg`.

## Allowlist

Per-agent allowlists are stored in DynamoDB via the `AllowlistProvider` interface. The built-in implementation (`createAllowlistStore`) uses:

```
pk: SHELL_GUARD_ALLOWLIST#<agentId>
sk: PATTERN#<pattern>
```

When a user clicks "Allow Always", each unknown executable from the command is added as a separate allowlist entry. Future commands with those executables auto-approve.

## Approval Flow

The approval flow is completely opaque to the agent. The agent never sees an approval request, never knows one happened, and never receives a notification reply.

### Happy path (command is safe)

```
Agent calls runCommand("git status")
  → guardCommand() → status: "allowed"
  → execCommand() runs in sandbox
  → agent receives { output, exitCode }
  → agent has no idea Shell Guard exists
```

### Invalid command (parse error)

```
Agent calls runCommand("echo $(whoami)")
  → guardCommand() → status: "invalid"
  → agent receives { output: "Command could not be parsed: ...", exitCode: 1 }
  → agent rewrites and retries
  → no user involvement
```

### Approval needed

```
Agent calls runCommand("ffmpeg -i video.mp4 output.gif")
  │
  ▼
guardCommand() → status: "approval_required"
  → create CommandApproval entity (PENDING)
  → runCommandTool returns { commandApprovalId, status: "pending_approval" }
  → onStepFinish attaches commandApprovalId to log entry
  → onStepFinish back-fills logEntryId on CommandApproval entity
  → pendingCommandApproval flag stops the turn
  │
  ▼
Frontend sees log entry with commandApprovalId
  → CommandApprovalCard renders inline: command, reason, 3 buttons
  │
  ▼ (user clicks Allow Always)
  │
resolveCommandApproval mutation
  → updates CommandApproval (RESOLVED, decision: ALLOW_ALWAYS)
  → extracts executables, adds each to allowlist
  → executes command in sandbox
  → updates log entry in-place with actual toolResult
  → publishes via PubSub (frontend refreshes)
  → enqueues resume_task inbox item
  │
  ▼
Consumer picks up resume_task
  → calls resumeTaskLane (runs inference from existing log, no new message)
  → agent sees a normal runCommand result: { output, exitCode }
  → agent continues, unaware approval happened
```

### Denial

Same flow as approval, but:
- Log entry's `toolResult` is updated to `{ output: "Command denied by user.", exitCode: 1 }`
- No allowlist entries added
- Agent sees a failed command and tries a different approach

### Guarding against new turns during pending approval

When a doorbell arrives for a task lane, the consumer calls `hasPendingApproval(ctx, agentId, taskId)` which queries DynamoDB for PENDING CommandApproval records. If one exists, the consumer breaks out of the drain loop.

The `runAgentTurn` function also halts when a command approval is created during a turn. A `pendingCommandApproval` flag is set in `onStepFinish` when a `runCommand` tool result contains `commandApprovalId`, and `stopWhen` checks this flag to end the `generateText` loop.

### Resuming after approval

After resolution, the consumer receives a `resume_task` inbox item. This calls `resumeTaskLane` which runs `runLane` directly — rebuilding context from the existing log and running inference without writing a new message. The agent picks up seamlessly from the updated tool result.

If other inbox items (e.g. user messages) arrived during the pending approval, those take priority — `processTaskGroup` runs with the non-resume items, which triggers inference anyway. The `resume_task` is redundant in this case and safely ignored.

## CommandApproval Entity

```
pk: COMMAND_APPROVAL
sk: COMMAND_APPROVAL#<id>
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique approval ID |
| `agentId` | string | Agent that triggered the approval |
| `taskId` | string | Task context (always set — sandbox tools require a task) |
| `command` | string | The full shell command |
| `reason` | string | Why it was flagged |
| `status` | enum | `PENDING` / `RESOLVED` |
| `decision` | string? | `ALLOW_ONCE` / `ALLOW_ALWAYS` / `DENY` (set on resolution) |
| `logEntryId` | string | The agent log entry this approval is attached to (back-filled by onStepFinish) |
| `createdAt` | string | ISO 8601 |
| `resolvedAt` | string? | ISO 8601 |

## Sandbox Session Lifecycle

No special handling is needed for sandbox sessions during approval. If the sandbox times out while waiting for approval, the session will be closed by the idle cleanup timer. When the agent's next turn runs after approval, `runCommand` will return "Sandbox is not online. Call ensureSandbox first to boot it up." The agent will call `ensureSandbox` and re-execute the command naturally.

## Integration Points

### Service registration

`shellGuardService` is registered in `packages/lib/src/services/index.ts` as `ctx.services.shellGuard`.

### sandboxTools.ts

`runCommandTool` accepts a `shellGuardEnabled` boolean. When true, every command is evaluated via `guardCommand()` before execution using a DDB-backed `AllowlistProvider`.

### agentLaneContext.ts

`buildTaskTools` passes `shellGuardEnabled: true` into `runCommandTool` when the agent has sandbox enabled.

### Agent log

The `AgentLog` entity has an optional `commandApprovalId` field. When present, the frontend renders the approval UI inline on the tool call card.

### Consumer

The consumer handles `resume_task` inbox items for task lanes. When `resume_task` is the only item, it calls `resumeTaskLane` to run inference from existing log. When mixed with other items, the other items trigger inference and `resume_task` is safely redundant.

### GraphQL

```graphql
enum CommandApprovalStatus {
  PENDING
  RESOLVED
}

enum CommandApprovalDecision {
  ALLOW_ONCE
  ALLOW_ALWAYS
  DENY
}

type CommandApproval {
  id: ID!
  agent: Agent!
  taskId: String!
  command: String!
  reason: String!
  status: CommandApprovalStatus!
  decision: String
  createdAt: String!
  resolvedAt: String
}

extend type Mutation {
  resolveCommandApproval(
    id: ID!
    decision: CommandApprovalDecision!
  ): CommandApproval
}
```

### Frontend rendering

The `CommandApprovalCard` component renders inline on `runCommand` tool call log entries when `commandApprovalId` is present:

- **PENDING**: shows command text, reason, and three buttons (Allow Once / Allow Always / Deny)
- **RESOLVED (allowed)**: renders normally (toolResult updated in-place with command output)
- **RESOLVED (denied)**: shows "Command denied by user"

## File Structure

```
packages/lib/src/services/shellGuard/
  index.ts                  # Barrel export + shellGuardService
  types.ts                  # AllowlistEntry, AllowlistProvider interfaces
  presets.ts                # SAFE_BINS_BUILTIN, SAFE_BINS_READ, SAFE_BINS_DEV, etc.
  shellParse.ts             # Shell command parsing (chains, pipes, heredocs, wrappers)
  guardCommand.ts           # Pure evaluation — returns GuardVerdict
  allowlistStore.ts         # DDB-backed AllowlistProvider implementation
  createCommandApproval.ts  # Create PENDING CommandApproval in DDB
  getCommandApproval.ts     # Load a single approval by ID
  resolveCommandApproval.ts # Resolve approval: execute command, update log, resume turn
  hasPendingApproval.ts     # Check if a pending approval exists for agent+task

packages/lib/src/services/orchestrator/
  resumeTaskLane.ts         # Run inference from existing log without new message

packages/lib/src/services/inbox/
  enqueueWork.ts            # resume_task inbox item type

packages/lib/src/resources/ddb/schema/
  commandApproval.ts        # CommandApproval DynamoDB entity

apps/server/src/gql/schema/CommandApproval/
  typeDefs.ts               # GraphQL types + resolveCommandApproval mutation
  resolvers.ts              # Mutation resolver

apps/mobile/src/shared/LogEntryView/
  CommandApprovalCard.tsx    # Inline approval UI on RunCommand tool cards
```
