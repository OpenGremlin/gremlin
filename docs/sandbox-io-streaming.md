# Sandbox I/O Streaming

How to surface real-time sandbox terminal output in the task UX.

## Problem

Today, sandbox command execution (`execCommand`) is fire-and-forget from the user's perspective. The server sends a command over the PTY WebSocket, collects output chunks until it sees a sentinel, then writes the final result as a single tool-call AgentLog entry. For long-running commands (builds, test suites, installs), the user sees nothing until the command finishes — which can be 30+ seconds of dead air.

The structured AgentLog view (tool call → result) is the right **primary** view: it's clean, scannable, and stored in DynamoDB. But there's no way to watch what's actually happening inside the container.

## Proposal

Add an ephemeral, real-time terminal stream alongside the existing structured log. Two layers:

```
┌─────────────────────────────────────────────┐
│  Task Detail View                            │
│                                              │
│  [Log]  [Terminal]                           │ ◄── tab toggle
│                                              │
│  LOG tab (default):                          │
│    Structured AgentLog entries               │
│    Tool calls with collapsed results         │
│    Same as today                             │
│                                              │
│  TERMINAL tab:                               │
│    Raw PTY output, streamed live             │
│    Read-only (no user input)                 │
│    xterm.js renderer                         │
│                                              │
└─────────────────────────────────────────────┘
```

### Why two layers

- **Log** is the permanent record. It's what you look at after a task completes. It lives in DynamoDB and drives the conversation thread.
- **Terminal** is the live debugger. It's what you watch while a task is running. It's ephemeral — not stored, just forwarded.

Storing raw PTY output in DynamoDB would be wasteful (high volume, low signal, ANSI escape sequences). Keeping it ephemeral avoids storage costs and keeps the log clean.

## Architecture

### Current flow

```
Sandbox PTY ──ws──► Server (execCommand) ──sentinel──► AgentLog (DynamoDB)
                         │                                    │
                         │                                    ▼
                         │                              GraphQL sub
                         │                           taskLogCreated
                         │                                    │
                         │                                    ▼
                         │                               Frontend
                         │                          (structured log)
                         ▼
                    Output discarded
                    until sentinel
```

### Proposed flow

```
Sandbox PTY ──ws──► Server (execCommand)
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
              Sentinel    PubSub
              detection   (live chunks)
                    │         │
                    ▼         ▼
              AgentLog    GraphQL sub
              (DDB)       sandboxOutput
                    │         │
                    ▼         ▼
              taskLogCreated  Frontend
              (structured)    (xterm.js)
```

The key change: instead of silently accumulating PTY output chunks in `execCommand`, also publish each chunk to a new pub/sub topic `sandboxOutput:${taskId}`.

### Server changes

**1. New pub/sub topic in `execCommand.ts`**

When the WebSocket `message` handler receives `{ type: "output", data }`, in addition to appending to the output buffer, publish:

```ts
pubsub.publish(`sandboxOutput:${taskId}`, { data, timestamp: Date.now() })
```

This requires threading `taskId` and the `pubsub` instance into `execCommand`. Currently `execCommand` only knows about the WebSocket connection — it needs context about which task is running.

**2. New GraphQL subscription**

```graphql
type Subscription {
  sandboxOutput(taskId: ID!): SandboxChunk!
}

type SandboxChunk {
  data: String!
  timestamp: Float!
}
```

Resolves to `pubsub.subscribe(`sandboxOutput:${taskId}`)`. No DynamoDB involved.

**3. No persistence**

Chunks are fire-and-forget through the pub/sub. If the frontend isn't subscribed, chunks are dropped. This is intentional — the structured AgentLog remains the source of truth.

### Frontend changes

**1. Terminal tab on TaskDetailPage**

Add a tab toggle between "Log" (existing) and "Terminal" (new). The Terminal tab renders an xterm.js instance.

**2. xterm.js integration**

```
npm install @xterm/xterm @xterm/addon-fit
```

On mount, subscribe to `sandboxOutput(taskId)`. Each chunk writes to the xterm terminal:

```ts
const term = new Terminal({ fontSize: 12, theme: { background: '#0a0a0a' } })
// on subscription data:
term.write(chunk.data)
```

The addon-fit handles responsive sizing. Read-only mode: don't attach a keyboard handler.

**3. Auto-switch behavior**

When a sandbox command starts executing (detected via a `launchSandbox` or `runCommand` tool call in the log stream), auto-switch to the Terminal tab. When the command completes, stay on Terminal but show a "Command finished" indicator.

### What about interactive terminals?

This proposal is read-only — the user watches but can't type. Full interactive terminal (user sends keystrokes to the sandbox) is a separate feature with different security implications. The read-only stream covers the debugging use case without opening up remote shell access from the frontend.

If we want interactive later, the path is: frontend xterm.js keystrokes → GraphQL mutation or dedicated WebSocket → server → sandbox PTY WebSocket `{ type: "input" }`. But that needs auth, rate limiting, and careful thought about who can send commands to a running sandbox.

## Open questions

1. **Buffering for late subscribers.** If the frontend connects to the subscription after a command has already started, it misses earlier output. Options:
   - Accept it — the structured log has the final result anyway.
   - Keep a small ring buffer (last N chunks) per task in memory. Send it on subscription connect.
   - Probably just accept it for v1.

2. **Multiple concurrent commands.** A task can run multiple `execCommand` calls sequentially. The terminal stream should show all of them continuously — which it will, since we publish every chunk regardless of which command produced it.

3. **Browser tools output.** The browser bridge (screenshots, navigation) goes through HTTP, not the PTY. Should browser tool results also appear in the terminal view? Probably not — those are structured data (screenshots, HTML content) that belong in the log view. The terminal is specifically for shell I/O.

4. **Output volume.** Some commands produce massive output (e.g., `npm install` with verbose logging). The pub/sub and WebSocket subscription handle backpressure naturally, but xterm.js can lag with very high throughput. Consider throttling: batch chunks into 50ms windows before publishing.

## File browsing (related but separate)

Surfacing the EFS `/workspace` contents in the frontend is a related need but doesn't require the streaming architecture. The simplest path: add a `listFiles` and `readFile` tool-like endpoint that runs `ls` and `cat` via `execCommand` on a running sandbox. The frontend renders a simple file tree. This works through the existing WebSocket pipe and doesn't need new infrastructure.

## Effort estimate

- Server pub/sub + subscription: small (~100 lines across execCommand.ts, schema, resolver)
- Frontend Terminal tab + xterm.js: medium (~200 lines, new component + subscription wiring)
- File browser: medium (~300 lines, new API route + frontend tree component)

The streaming piece is straightforward because the PTY chunks are already flowing through the server — we're just forwarding them instead of silently buffering.
