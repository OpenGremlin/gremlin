# Sandbox Command Execution — Design Doc

How to make command input/output reliable, fast, and observable.

## Current State & Problems

### The Architecture Today

```
Server (execCommand)                    Sandbox (relay.ts)
  │                                       │
  │  { type: "input",                     │
  │    data: "cmd; echo SENTINEL\n" }     │
  │  ─────────────────────────────────►   │
  │                                       │  shell.write(data)
  │                                       │       │
  │                                       │       ▼
  │                                       │    bash PTY
  │                                       │    (xterm-256color)
  │                                       │       │
  │   { type: "output", data: "..." }     │       │
  │  ◄─────────────────────────────────   │  shell.onData
  │                                       │
  │  accumulate output += data            │
  │  strip ANSI, regex match sentinel     │
  │  if match → resolve(CommandResult)    │
  │  if 120s → resolve(timedOut)          │
  │                                       │
```

### What Goes Wrong

**1. History expansion breaks commands (`!` in strings)**

The command `echo "Hello!"` triggers bash history expansion. The PTY runs a
real interactive bash shell with `set -H` (history expansion enabled by
default in interactive shells). Any `!` inside double quotes is interpreted
as a history reference:

```
bash: !": event not found
```

The sentinel echo also uses double quotes: `echo "${sentinel}$?__"`, so
if the command itself corrupts the shell state, the sentinel may never print.

**2. The sentinel can be swallowed by the command**

If a command reads stdin, starts an interactive program, or enters a sub-shell
prompt, the sentinel echo — which is appended with `;` — may not execute or
may execute inside the wrong context. Examples:

- `python` (interactive REPL) — the sentinel becomes Python syntax error
- `vim file.txt` — sentinel is typed into vim
- `cat` (no args) — waits for stdin forever, sentinel never reached
- `read -p "Enter: " x` — waits for user input

**3. No stderr separation**

The PTY merges stdout and stderr into a single stream. The model gets one
`output` field with everything interleaved. It cannot distinguish between
a warning on stderr and actual output on stdout. Claude Code has the same
limitation and doesn't attempt to separate them (PTY is inherently merged).

**4. Output includes the echoed command**

The PTY echoes the input command back (because `set -o echo` is on by
default in interactive shells). So the output starts with the full wrapped
command text including the sentinel:

```
figlet "Hello" && ...; echo "__GREMLIN_DONE_uuid__$?__"
bash: !": event not found
bash-3.2$
```

This wastes tokens and confuses the model about what the actual output was.

**5. Timeout is the only completion signal**

If the sentinel regex doesn't match (due to ANSI corruption, command
interference, or shell errors), the only fallback is the 120s timeout.
There's no heartbeat, no progress signal, no way to know the command
finished but the sentinel was garbled.

**6. ANSI stripping is incomplete**

The current regex handles CSI sequences and OSC, but misses:
- Cursor position reports (`\x1b[6n` responses)
- Bracketed paste mode markers (`\x1b[?2004h/l`)
- Partial sequences split across WebSocket messages
- `\r` carriage returns that cause visual output corruption

## Design: Reliable Command Execution

### Principle: Avoid PTY for Command Execution

Claude Code's key insight: **don't fight the terminal**. The PTY exists to
give programs a realistic environment (TERM, tty, job control), but for
non-interactive command execution, it introduces more problems than it
solves. The echoing, history expansion, ANSI sequences, and prompt rendering
all exist for human users, not for programmatic control.

The recommended approach: **use a non-interactive shell with separated
stdout/stderr, and reserve the PTY for interactive streaming**.

### Two Execution Modes

```
┌───────────────────────────────────────────────────────────┐
│                    execCommand v2                         │
│                                                          │
│  Mode 1: EXEC (default)                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  /bin/bash -c "command"                             │  │
│  │  child_process.spawn, no PTY                        │  │
│  │  stdout pipe → stdout buffer                        │  │
│  │  stderr pipe → stderr buffer                        │  │
│  │  exit code from process exit event                  │  │
│  │  No sentinel needed. No ANSI. No echo.              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  Mode 2: PTY (interactive / streaming)                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Existing PTY approach (improved)                   │  │
│  │  For: dev servers, REPLs, tailing logs              │  │
│  │  Streamed to frontend via pub/sub                   │  │
│  │  Timeout → auto-background as task                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
└───────────────────────────────────────────────────────────┘
```

## Exec Mode (Non-Interactive)

### Relay-Side: New `exec` Message Type

Add a new WebSocket message type to `relay.ts` that spawns a child process
instead of writing to the PTY:

```ts
// relay.ts — new message handler
if (msg.type === "exec") {
  const { id, command, timeout, env } = msg;

  const proc = spawn("/bin/bash", ["-c", command], {
    cwd: WORKSPACE_DIR,
    env: { ...shellEnv, ...env },
    stdio: ["ignore", "pipe", "pipe"],   // no stdin
    timeout: timeout ?? 120_000,
  });

  let stdout = "";
  let stderr = "";

  proc.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
    // Stream progress chunks to server
    ws.send(JSON.stringify({
      type: "exec:output",
      id,
      stream: "stdout",
      data: chunk.toString(),
    }));
  });

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
    ws.send(JSON.stringify({
      type: "exec:output",
      id,
      stream: "stderr",
      data: chunk.toString(),
    }));
  });

  proc.on("close", (code, signal) => {
    ws.send(JSON.stringify({
      type: "exec:done",
      id,
      exitCode: code ?? (signal ? 128 : -1),
      stdout,
      stderr,
    }));
  });

  proc.on("error", (err) => {
    ws.send(JSON.stringify({
      type: "exec:done",
      id,
      exitCode: -1,
      stdout,
      stderr: stderr + "\n" + err.message,
      error: err.message,
    }));
  });
}
```

Key differences from the PTY approach:
- **No sentinel needed** — completion is the process exit event
- **No ANSI codes** — stdout/stderr are pipes, not a terminal
- **Separated streams** — stdout and stderr are distinct
- **No echo** — the command text is not reflected back
- **No history expansion** — non-interactive bash doesn't enable `set -H`
- **No prompt rendering** — no `bash-3.2$` in output

### Server-Side: Exec-Based execCommand

```ts
// execCommand.ts — new exec mode
export async function execCommand(
  session: SandboxSession,
  command: string,
  options?: { timeout?: number; env?: Record<string, string> },
): Promise<CommandResult> {
  const ws = session.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Sandbox WebSocket not connected");
  }

  const id = crypto.randomUUID();
  const timeout = options?.timeout ?? COMMAND_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        stdout: truncate(stdoutBuf),
        stderr: truncate(stderrBuf),
        exitCode: -1,
        timedOut: true,
        durationMs: Date.now() - startTime,
      });
    }, timeout);

    let stdoutBuf = "";
    let stderrBuf = "";

    function onMessage(raw: Buffer) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id !== id) return;   // ignore messages from other commands

        if (msg.type === "exec:output") {
          if (msg.stream === "stdout") stdoutBuf += msg.data;
          if (msg.stream === "stderr") stderrBuf += msg.data;
          // Publish for live streaming (see streaming section below)
        }

        if (msg.type === "exec:done") {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          cleanup();
          resolve({
            stdout: truncate(msg.stdout ?? stdoutBuf),
            stderr: truncate(msg.stderr ?? stderrBuf),
            exitCode: msg.exitCode,
            timedOut: false,
            durationMs: Date.now() - startTime,
          });
        }
      } catch { /* ignore */ }
    }

    function cleanup() {
      ws?.off("message", onMessage);
    }

    ws.on("message", onMessage);
    ws.send(JSON.stringify({
      type: "exec",
      id,
      command,
      timeout,
      env: options?.env,
    }));
  });
}
```

### Updated Types

```ts
export interface CommandResult {
  stdout: string;        // was: output (merged)
  stderr: string;        // new: separated stderr
  exitCode: number;
  timedOut: boolean;
  durationMs: number;    // new: execution duration
}
```

For backward compatibility, the tool result sent to the model can merge
them if stderr is short:

```ts
// In sandboxTools.ts runCommandTool
const result = await ctx.services.sandbox.execCommand(session, command);

// Format for model consumption
const output = result.stderr
  ? `${result.stdout}\n\n[stderr]\n${result.stderr}`
  : result.stdout;

return {
  output,
  exitCode: result.exitCode,
  timedOut: result.timedOut,
};
```

## What the Model Sees

### Tool Definition (Input)

```ts
runCommand: tool({
  description: `Execute a shell command in the sandbox.
Returns stdout, stderr, and exit code.
Commands run non-interactively (no TTY). For long-running
processes, use backgroundCommand instead.
Timeout: ${COMMAND_TIMEOUT_MS / 1000}s. Output capped at ${MAX_OUTPUT_CHARS} chars.`,

  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
  }),
})
```

Keep it simple. The model sends `{ command: "npm test" }` and gets back
structured output. No timeout parameter — the model shouldn't control
execution parameters. Those are system-level concerns.

### Tool Result (Output)

**Success case:**
```json
{
  "output": "test output here...",
  "exitCode": 0,
  "timedOut": false
}
```

**Non-zero exit:**
```json
{
  "output": "some stdout\n\n[stderr]\nError: file not found",
  "exitCode": 1,
  "timedOut": false
}
```

**Timeout:**
```json
{
  "output": "(first 4K of output)...\n... [output truncated] ...\n(last 4K)",
  "exitCode": -1,
  "timedOut": true
}
```

**Large output (spilled to disk):**
```json
{
  "output": "(truncated preview, first 4K + last 4K)",
  "exitCode": 0,
  "timedOut": false,
  "fullOutputPath": "/workspace/.gremlin/output/cmd-abc123.txt",
  "fullOutputBytes": 524288,
  "note": "Output exceeded 50KB. Full output saved to fullOutputPath. Use cat or head to read specific sections."
}
```

## Output Limiting Strategy

Borrowing from Claude Code's approach, use a three-tier system:

```
Output size          Action
─────────────        ──────────────────────────────────────────
≤ 8KB                Inline in tool result (current behavior)
8KB–50KB             Inline but truncated (first 4K + last 4K)
> 50KB               Spill to /workspace/.gremlin/output/
                     Return truncated preview + file path
                     Model can read sections with cat/head/tail
```

### Implementation

Disk spill happens on the relay side, not the server, to avoid transferring
massive payloads over WebSocket:

```ts
// relay.ts — in exec handler
const MAX_INLINE_BYTES = 50 * 1024;  // 50KB

proc.on("close", (code, signal) => {
  const totalSize = stdout.length + stderr.length;

  if (totalSize > MAX_INLINE_BYTES) {
    // Write full output to disk
    const outputPath = `/workspace/.gremlin/output/${id}.txt`;
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, stdout);
    if (stderr) {
      writeFileSync(`${outputPath}.stderr`, stderr);
    }

    ws.send(JSON.stringify({
      type: "exec:done",
      id,
      exitCode: code ?? -1,
      // Send truncated preview
      stdout: stdout.slice(0, 4096) + "\n...[truncated]...\n" + stdout.slice(-4096),
      stderr: stderr.slice(0, 2048),
      fullOutputPath: outputPath,
      fullOutputBytes: stdout.length,
    }));
  } else {
    // Normal inline response
    ws.send(JSON.stringify({
      type: "exec:done",
      id,
      exitCode: code ?? -1,
      stdout,
      stderr,
    }));
  }
});
```

### Memory Protection

To prevent the relay from OOMing on commands that produce gigabytes of
output (e.g., `yes`, `cat /dev/urandom`):

```ts
const MAX_BUFFER_BYTES = 5 * 1024 * 1024;  // 5MB hard cap

proc.stdout.on("data", (chunk) => {
  if (stdout.length < MAX_BUFFER_BYTES) {
    stdout += chunk.toString();
  }
  // Always stream chunks for live viewing, regardless of buffer cap
  ws.send(JSON.stringify({
    type: "exec:output", id,
    stream: "stdout",
    data: chunk.toString().slice(0, 8192),  // cap per-chunk too
  }));
});
```

## Timeout & Background Strategy

Borrow Claude Code's auto-background approach:

```
Command starts
    │
    ▼
Running... (stream chunks to frontend)
    │
    ├── Finishes within timeout → return result
    │
    ├── Hits soft timeout (default 30s) ──► Auto-background
    │   │
    │   └── Return to model immediately:
    │       { "status": "backgrounded",
    │         "taskId": "...",
    │         "note": "Command still running. Use checkCommand(taskId) to poll." }
    │
    └── Hits hard timeout (120s) ──► Kill process
        │
        └── Return: { exitCode: -1, timedOut: true, output: "..." }
```

### Two Timeouts

```ts
const SOFT_TIMEOUT_MS = 30_000;   // auto-background threshold
const HARD_TIMEOUT_MS = 120_000;  // kill threshold
```

- **Soft timeout**: The model gets a response and can continue working.
  The command keeps running in the background. A `checkCommand` tool lets
  the model poll for results later.
- **Hard timeout**: The process is killed. This prevents runaway commands
  from consuming resources indefinitely.

### checkCommand Tool

```ts
checkCommand: tool({
  description: "Check the status of a backgrounded command. Returns current output and whether the command has finished.",
  inputSchema: z.object({
    commandId: z.string().describe("The command ID returned by runCommand when it was backgrounded"),
  }),
  execute: async ({ commandId }) => {
    const task = backgroundTasks.get(commandId);
    if (!task) return { error: "Unknown command ID" };
    if (task.done) {
      backgroundTasks.delete(commandId);
      return {
        output: task.stdout,
        exitCode: task.exitCode,
        finished: true,
      };
    }
    return {
      output: task.stdout.slice(-2000),  // tail of current output
      finished: false,
    };
  },
})
```

## Shell Environment Persistence

One thing the current PTY approach gets right: the shell session persists
between commands. `cd /workspace/myproject && export FOO=bar` in one command
affects the next. The exec mode loses this because each command spawns a
new bash process.

### Solution: Shell State File

After each successful command, capture the shell environment and persist it:

```ts
// Wrap commands to capture env state after execution
function wrapWithEnvCapture(command: string, envFile: string): string {
  return `${command}
__exit_code=$?
env > "${envFile}"
pwd > "${envFile}.cwd"
exit $__exit_code`;
}
```

Before each command, restore the environment:

```ts
function buildCommand(command: string, envFile: string): string {
  // Source previous env if available, then run command
  return `
    if [ -f "${envFile}" ]; then
      while IFS='=' read -r key value; do
        export "$key=$value" 2>/dev/null
      done < "${envFile}"
      cd "$(cat "${envFile}.cwd" 2>/dev/null || echo /workspace)"
    fi
    ${command}
  `;
}
```

This gives us the persistence benefits of a PTY session without the PTY
downsides. The env file lives at `/workspace/.gremlin/shell-state`.

**Alternative** (simpler): Just prepend `cd <last_cwd> &&` and pass the
stored env vars via the `spawn()` env option. This avoids shell-parsing
edge cases with the `env` file approach:

```ts
const proc = spawn("/bin/bash", ["-c", command], {
  cwd: lastCwd ?? WORKSPACE_DIR,
  env: { ...baseEnv, ...capturedEnv, ...userEnv },
  stdio: ["ignore", "pipe", "pipe"],
});
```

The cwd and env are tracked in memory on the relay side, updated after
each command completes. If the relay restarts, they reset to defaults —
acceptable since the sandbox container is ephemeral anyway.

## Live Streaming (Frontend)

This is covered in `sandbox-io-streaming.md` but here's how it integrates
with the new exec mode:

### Server Publishes Chunks

```ts
// In execCommand, on each exec:output message
if (msg.type === "exec:output" && pubsub && taskId) {
  pubsub.publish(`sandboxOutput:${taskId}`, {
    sandboxOutput: {
      data: msg.data,
      stream: msg.stream,   // "stdout" | "stderr"
      commandId: id,
      timestamp: Date.now(),
    },
  });
}
```

### Frontend Subscribes

```graphql
subscription SandboxOutput($taskId: ID!) {
  sandboxOutput(taskId: $taskId) {
    data
    stream
    commandId
    timestamp
  }
}
```

The frontend can render stdout and stderr in different colors in the
xterm.js view, or filter by stream type.

### Progress for the Model

While the exec runs, the model is blocked waiting for the tool result.
But the *user* sees live output in the Terminal tab. This matches Claude
Code's behavior: the model waits, the user watches.

For very long commands, the auto-background kicks in and the model
gets unblocked.

## PTY Mode (Interactive)

The existing PTY path stays for interactive use cases. When the model
(or user) needs to run a dev server, REPL, or interactive program, use
PTY mode:

```ts
// sandboxTools.ts
startInteractive: tool({
  description: "Start an interactive/long-running process in the sandbox PTY (e.g., dev server, REPL). Output streams to the terminal view. Use runCommand for non-interactive commands.",
  inputSchema: z.object({
    command: z.string(),
  }),
  execute: async ({ command }) => {
    // Write to PTY, don't wait for sentinel
    session.ws.send(JSON.stringify({ type: "input", data: command + "\n" }));
    return {
      status: "started",
      note: "Process is running in the sandbox terminal. Output is streaming to the terminal view.",
    };
  },
})
```

The PTY approach is retained as-is but is no longer the default path for
`runCommand`. The improved sentinel matching from the current implementation
can stay as a fallback, but most commands should use exec mode.

## WebSocket Protocol Summary

### Current Messages

| Direction    | Type     | Payload                        |
|-------------|----------|--------------------------------|
| Server → SB | `input`  | `{ data: string }`            |
| SB → Server | `output` | `{ data: string }`            |
| SB → Server | `ready`  | `{}`                           |
| SB → Server | `exit`   | `{ exitCode: number }`        |
| Server → SB | `resize` | `{ cols, rows }`               |

### New Messages (Exec Mode)

| Direction    | Type          | Payload                                |
|-------------|---------------|----------------------------------------|
| Server → SB | `exec`        | `{ id, command, timeout?, env? }`      |
| SB → Server | `exec:output` | `{ id, stream, data }`                 |
| SB → Server | `exec:done`   | `{ id, exitCode, stdout, stderr, fullOutputPath?, fullOutputBytes? }` |

The `id` field multiplexes: multiple exec commands can be in flight
(though we'll typically run one at a time). The existing PTY messages
(`input`/`output`) continue to work for interactive mode.

## Migration Plan

### Phase 1: Exec Mode (fixes all current bugs)

1. Add `exec` message handler to `relay.ts`
2. Update `execCommand.ts` to use exec protocol instead of sentinel
3. Update `CommandResult` type to include `stderr`
4. Update `sandboxTools.ts` to format `stderr` for model
5. Keep PTY path working for `startInteractive` tool

### Phase 2: Output Limiting

1. Add disk-spill logic to relay for large outputs
2. Add `fullOutputPath` handling to `execCommand.ts`
3. Update tool result formatting for spilled outputs

### Phase 3: Auto-Background

1. Add soft timeout + background task tracking
2. Add `checkCommand` tool
3. Track in-memory background task state

### Phase 4: Live Streaming

1. Thread `pubsub` + `taskId` into `execCommand`
2. Add `sandboxOutput` GraphQL subscription
3. Frontend Terminal tab (per `sandbox-io-streaming.md`)

### Phase 5: Shell State Persistence

1. Track cwd + env in relay memory
2. Apply captured state to each new exec spawn
3. Reset on relay restart

## Summary

| Problem                      | Current          | Fix                         |
|-----------------------------|------------------|-----------------------------|
| `!` history expansion       | PTY, interactive | Exec mode, non-interactive  |
| Sentinel swallowed          | `;` chaining     | Process exit = completion   |
| No stderr separation        | Merged PTY       | Separate pipes              |
| Command echo in output      | PTY echo         | No TTY, no echo             |
| Timeout-only completion     | 120s wait        | Process exit event          |
| ANSI in output              | Regex stripping  | No TTY, no ANSI             |
| No live progress            | Silent buffer    | Stream chunks via pub/sub   |
| Large output OOM            | 8K truncation    | Disk spill at 50KB          |
| No background commands      | Kill at timeout  | Auto-background at 30s      |
| Lost shell state            | PTY persists     | Env/cwd capture per command |
