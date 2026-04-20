# Canvas

A live, agent-driven UI surface that runs in a browser tab or on a Chromecast. Agents push structured UI descriptions; the canvas renders them. The mobile app is the controller — it picks the cast device, holds auth, and brokers the session.

## Motivation

Agents produce visual artifacts (charts, images, code, data tables, walkthroughs) that today live as text inside a chat thread. The canvas surfaces them on a bigger screen so the agent's output becomes ambient — visible at a glance, controllable from the phone, and naturally suited to demos, monitoring, and shared viewing.

Cast support is the headline delivery channel, but the canvas is also just a webpage — anyone can open it in a browser tab and get the same view.

### Non-goals

- **Not a remote control surface.** The canvas displays agent output. Touch/gesture interaction passthrough is explicitly out of scope for v1.
- **Not a screen mirror.** The canvas is not a video stream of the mobile app. It is its own page rendering its own React tree from server-pushed state.
- **Not multi-viewer.** v1 assumes one phone driving one canvas. Cast technically supports multiple senders; that's deferred.
- **No audio.** Cast supports audio streams; the canvas does not use them.
- **No offline mode.** Receiver requires a live AG-UI stream. If the connection drops past the reconnect budget, it shows an error state.

## Architecture

```
 Mobile (sender)              Cast device                Gremlin backend
 ───────────────              ───────────                ───────────────

 user taps "cast"
       ↓
 Cast SDK discovers
       ↓
 launches Receiver App ID  →  loads opengremlincanvas.com
                                    ↓
 sends { backendUrl,        →  receiver gets session info
         token, agentId }        opens AG-UI stream  →  /canvas/sse
                                    ↑                          ↑
                                    │                  agent calls canvas.show()
                                    │                          ↓
                                    │                  UI subagent (Haiku)
                                    │                  emits A2UI tree
                                    └──── A2UI events ─┘
```

Three layers in motion:

- **Cast** wires the mobile app to a TV-class browser running our receiver page.
- **AG-UI** is the bi-directional event stream between receiver and Gremlin backend.
- **A2UI** is the declarative UI schema agents emit; the receiver renders it as React components.

## Hosting

The canvas page lives on a **separate eTLD+1** from `opengremlin.com` — e.g. `opengremlincanvas.com`. Two reasons:

- **Cookie isolation.** Anything set on `.opengremlin.com` is automatically scoped away. An XSS or supply-chain compromise in the canvas can't grab opengremlin.com session cookies or hit opengremlin.com APIs as the user. Industry pattern: GitHub → `githubusercontent.com`, Google → `googleusercontent.com`, Dropbox → `dropboxusercontent.com`.
- **Permanence.** The Cast Receiver App ID is bound to the URL forever. Moving domains later means a new App ID and a sender update.

The infra (S3 + CloudFront + OAC) is in `packages/infra/lib/canvas-stack.ts`. The bundle is built from `apps/canvas` (Vite + React).

### Why Vite + React

- **Vite** because the receiver is a single static SPA — no server, no SSR, no routing complexity. Vite's tiny dev server and zero-config build are a clean fit. The bundle is a few hundred KB and ships to CloudFront.
- **React** because the A2UI React renderer (Q1 2026) is the official path. The canvas is a thin wrapper around `<A2UIRenderer tree={current} />` plus state from the AG-UI client.

### Why a single hosted shim, not per-deployment receivers

Gremlin is self-hostable; every customer has their own backend URL. But the Cast Receiver App ID is bound to one HTTPS URL and requires a $5 + multi-week Google review per registration. Asking each self-hosted user to register their own receiver is untenable.

So opengremlincanvas.com is a **single static shim** that knows how to point at any Gremlin backend. The customer's backend URL is passed in as a runtime parameter (see [Auth and session bootstrap](#auth-and-session-bootstrap)). The opengremlin domain hosts a CDN-served HTML+JS bundle; it's never in the data path. Plex, Jellyfin, and Home Assistant all use exactly this pattern.

For paranoid self-hosters who don't want to depend on opengremlincanvas.com, the same bundle can be hosted under their own domain and registered as their own Receiver — same code, different App ID.

### Build and deploy pipeline

The receiver build mirrors the existing `apps/mobile` web build pattern:

- `apps/canvas/scripts/build-web.sh` runs `turbo prune @opengremlin/canvas`, installs into a slim node container, runs `pnpm build`, and copies `dist/` to the CDK asset output.
- CDK invokes the script during synth via `s3deploy.BucketDeployment`'s Docker bundling, then ships the result to S3 and invalidates CloudFront.
- The CloudFront URL is published to SSM at `/gremlin/canvas-url` so other stacks (and the mobile app) can resolve it without hardcoding.

## Cast registration

Steps to register the canvas as a Custom Receiver in the Google Cast SDK Developer Console:

1. Sign up for the Cast SDK Developer Console (one-time $5 fee).
2. Register the dev/test Chromecast device by serial number — unpublished receivers only run on whitelisted devices.
3. Create a Custom Receiver app pointing at `https://opengremlincanvas.com`. The console returns a permanent **Application ID** (e.g. `ABCD1234`) that mobile senders use to launch the receiver.
4. Reboot the registered device so it picks up the whitelist (~15-min propagation).
5. For public release, submit for publication review (weeks-long, manual). Until then the receiver works on whitelisted devices only — fine for dev, beta, or self-hosters.

## Auth and session bootstrap

The receiver loads with no auth context — it's just a static page on `opengremlincanvas.com`. The mobile app, which is already authenticated to the Gremlin backend, brokers the session.

Sequence on cast start:

1. Mobile asks the Gremlin backend for a **scoped canvas session token** — short-lived (~5 min), refreshable, scoped to one `(agentId, sessionId)` pair. Not full account access.
2. Mobile launches the receiver via Cast App ID.
3. Mobile sends `{ backendUrl, token, agentId, sessionId }` to the receiver as the first custom message on namespace `urn:x-cast:com.opengremlin.canvas`.
4. Receiver opens an AG-UI stream to `${backendUrl}/canvas/sse` with the token in the `Authorization` header.
5. On token expiry, receiver requests a refresh from the sender over the same custom-message channel.

Why scoped tokens: the Cast device is in someone's home but it's still arbitrary hardware running an arbitrary CAF runtime. A leaked token can only do canvas operations against one session, not impersonate the user.

### Browser-only mode

The same canvas page works in a regular browser tab — no Cast involved. This is the dev path and a fallback for users without a cast device.

In browser mode, the page reads `backendUrl`, `token`, and `agentId` from URL query params instead of a Cast custom message. The mobile app generates a signed link the user can open on a laptop:

```
https://opengremlincanvas.com/?backend=https%3A%2F%2Fgremlin.acme.com&agent=AGT_42&t=<scoped-token>
```

Same auth model, same AG-UI stream, same renderer. The CAF bootstrap (`apps/canvas/src/cast.ts`) no-ops outside a Cast device, so the browser path falls through cleanly.

## Transport: AG-UI

[AG-UI](https://docs.ag-ui.com/) is an open protocol for streaming events between an agentic backend and a frontend. Events flow over Server-Sent Events (server → client) with companion HTTP POST endpoints for client → server actions.

Why AG-UI rather than rolling our own over `graphql-ws`:

- **Purpose-built.** AG-UI defines lifecycle, state-patch, tool-call, and message events. Re-implementing all of this on top of GraphQL subscriptions is a meaningful rebuild.
- **SSE-friendly through CDNs and proxies.** CloudFront passes SSE through cleanly; corporate networks rarely block it the way they block WebSockets.
- **Survives sender sleep.** SSE is a server → client push, so the receiver doesn't depend on mobile staying foregrounded. The Cast session can outlive the phone going to sleep.

AG-UI runs **alongside** the existing GraphQL stack, not as a replacement. A new endpoint (e.g., `/canvas/sse`) is added to the Gremlin backend. Everything else continues to use GraphQL.

## UI schema: A2UI

[A2UI](https://a2ui.org/) is Google's declarative UI protocol for agent-driven interfaces. Agents emit a flat list of components with ID references; the client maps each component to a native widget. A2UI explicitly does not support arbitrary code execution — agents can only emit declarative trees, not JS.

Why A2UI rather than rolling a custom component schema:

- **LLM-friendly.** Designed to be incrementally generated, self-corrected mid-stream, and partially rendered.
- **Standard vocabulary.** Avoids reinventing component types like `text`, `image`, `code`, `chart`, `stack`, `card`.
- **Safety property.** No code execution is the exact property that makes hosting on a separate domain safe — even an A2UI tree compromised in transit can't run JS in the canvas page.
- **React renderer.** A native A2UI React renderer is shipping in 2026, which slots directly into the Vite + React canvas app.

A2UI rides on top of AG-UI: agents emit A2UI trees, AG-UI streams them as state-patch events.

### Streaming semantics

Each canvas update carries a monotonic `revision` number. The wire protocol leans on AG-UI's standard event types:

- `RUN_STARTED` — UI subagent began producing a new tree.
- `STATE_DELTA` — partial A2UI tree fragment; receiver merges by component ID.
- `RUN_FINISHED` — tree complete; receiver may transition out of any "rendering" state.
- `STATE_SNAPSHOT` — full A2UI tree, used on initial connect and reconnects.

Because A2UI components are addressed by ID, the receiver can apply deltas mid-stream and the partial state is always renderable.

## Tool surface

The task agent does not know A2UI exists. It sees an intent-shaped tool:

```ts
canvas.show(intent: string, context?: Json)
canvas.clear()
```

The agent describes *what* it wants to surface ("show the chart I generated comparing Q1 vs Q2 revenue") and hands over whatever raw data it has (the chart numbers, an image URL, a code snippet). It does not lay out components, pick fonts, or reason about hierarchy.

### Tool semantics

| Aspect | Behavior |
|---|---|
| Return value to task agent | `{ rendered: true, revision }` on success; `{ rendered: false, reason }` on failure. Agent gets a confirmation it can reference in subsequent reasoning. |
| Idempotency | Each call replaces the canvas root by default. Append/merge semantics are not v1. |
| Error path | UI subagent failure surfaces as a tool error to the task agent, not as a broken canvas. The receiver keeps showing whatever it had. |
| No active session | Tool succeeds and writes to persisted last-state, but no live receiver is updated. Next cast session picks up the persisted state. |
| Tool is always available | Every agent gets `canvas.show` and `canvas.clear`. No opt-in flag. The system prompt nudges sparing use. |

## UI subagent

Translation from intent to A2UI tree happens in a dedicated **UI subagent** — Haiku-class, statelessly invoked per `canvas.show` call.

```
 Task agent calls canvas.show(intent, context)
            ↓
 Orchestrator dispatches UI subagent with:
   - intent + context
   - current A2UI tree (so transitions don't jar)
   - system prompt loaded with A2UI schema + few-shot examples
            ↓
 UI subagent streams an A2UI tree as output
            ↓
 Orchestrator forwards each AG-UI event to the canvas channel
            ↓
 Receiver renders incrementally
```

Why a subagent rather than letting the task agent emit A2UI directly:

- **Focus.** Task agents reason about tasks. Bloating their system prompt with A2UI vocabulary is dead weight on every reasoning step.
- **Single source of UI judgment.** Layout, hierarchy, and what to emphasize live in one prompt. You can iterate on visual style without touching task agents.
- **Cheap model fits the job.** Translation problems suit Haiku; reasoning problems suit Sonnet/Opus. This keeps the expensive model on the work that justifies it.
- **Stateless per invocation.** Avoids canvas-state drift across the task agent's multi-turn reasoning.

### Fast path for the obvious cases

Trivial intents — "show this image", "show this code block" — short-circuit through a deterministic intent → A2UI mapper. No LLM call. The UI subagent only fires for ambiguous "compose something nice from this data" cases.

## Initial trigger

Agents decide when to surface things. The system prompt nudges them: "when you produce visual artifacts, call `canvas.show`." Users can also ask explicitly ("put that on the canvas") — the agent translates to a tool call. One pathway, two ways to invoke it.

What appears when the user first casts: persist the **last canvas state** per `(agentId, userId)`. If nothing has been shown yet, render a branded splash with "Waiting for &lt;agent name&gt;." Avoid blank screens — also a Cast review requirement.

## Persistence

Canvas state lives in DynamoDB alongside the existing agent data, keyed by `(agentId, userId)`:

| Key | Value |
|-----|-------|
| PK | `CANVAS_STATE` |
| SK | `CANVAS#<agentId>#<userId>` |
| body | latest A2UI tree, revision number, `updatedAt` |
| TTL | 30 days from last update |

A new cast session always starts from this row, then is overwritten by the next `canvas.show` call. TTL keeps the table from accumulating dead state for abandoned agents.

## Lifecycle states

The receiver moves through a small state machine:

```
 boot → connecting → live → idle → live → ...
                       ↓      ↓
                    error  reconnecting → live
                              ↓
                            error
```

| State | Trigger | UI |
|---|---|---|
| `boot` | Page load before Cast / browser handoff completes | Splash with logo |
| `connecting` | Have backend URL + token, AG-UI stream not yet open | "Connecting to &lt;agent&gt;…" |
| `live` | AG-UI stream open, latest A2UI tree rendering | Agent content |
| `idle` | No `canvas.show` call for &gt; 5 min | Last tree dimmed; subtle "idle" indicator |
| `reconnecting` | Stream dropped; retry budget not exhausted | Last tree visible; "Reconnecting…" toast |
| `error` | Token refresh failed, retry budget exhausted, or backend rejects | Branded error screen with "Recast from your phone" instruction |

Cast review requires every one of these to be a styled, branded screen — never a blank page or a raw error string.

## Reconnection and recovery

- **SSE reconnect** — exponential backoff up to 30 s, capped at 5 attempts before surfacing `error`. The AG-UI client handles this; the receiver only renders status.
- **State recovery on reconnect** — receiver requests a `STATE_SNAPSHOT` (current persisted A2UI tree) so it doesn't have to wait for the next `canvas.show` to repopulate.
- **Token expiry** — receiver detects a 401, asks the sender for a refresh via Cast custom message. If the sender is unreachable (phone gone), receiver transitions to `error` after one attempt.
- **Sender disconnect** — Cast session ends, receiver page is destroyed by the Cast device. No graceful shutdown needed; the persisted state remains for the next session.

## Phone controls

Two layers, only the first is in scope for v1:

- **Session control** — start/stop cast, switch which agent the canvas is bound to, blank the screen.
- **UI interaction** (later) — scroll, zoom, select, sent as commands over the same Cast custom-message channel back to the receiver, which forwards to the backend as mutations.

Most agent UIs are read-only "look what I made" content. Resist building a remote-control surface on day one.

### Mobile cast experience

The mobile **Canvas** tab sits between Jobs and Files in the bottom tab bar (lucide `Cast` icon). The screen has three states:

1. **Searching** — when no devices are visible. Spinner + "Searching for devices."
2. **Device list** — discovered Cast/AirPlay devices. Tapping one starts a session and the row shows a connecting indicator.
3. **Connected** — shows the live cast target, which agent is bound, and controls: switch agent, blank screen, disconnect.

Discovery uses `react-native-google-cast` (Chromecast) and `AVRoutePickerView` (AirPlay on iOS). Both require an Expo prebuild + dev-client rebuild — they are native modules that can't run in Expo Go.

The mobile app also surfaces a **cast indicator** in the global header when a session is active, so the user can disconnect from anywhere in the app, not only the Canvas tab.

## Receiver app structure

`apps/canvas` (Vite + React):

```
apps/canvas/
├── index.html              # loads the CAF SDK from gstatic in <head>
├── src/
│   ├── main.tsx            # bootstrapCast() then mount React
│   ├── cast.ts             # CAF receiver bootstrap (no-op in browser)
│   ├── App.tsx             # state machine + A2UI renderer
│   ├── session.ts          # parses sender custom message OR URL params
│   ├── agui.ts             # AG-UI SSE client + reconnect logic
│   └── index.css           # base styles, dark stage, splash
├── scripts/build-web.sh    # turbo-prune + Docker build for CDK
└── vite.config.ts
```

The bundle is intentionally small (a few hundred KB). No GraphQL client, no Apollo, no router — the canvas does one thing.

## Telemetry and observability

The Gremlin backend logs canvas events the same way it logs other agent activity:

- `canvas.session.started` — `{ agentId, userId, deviceModel }`
- `canvas.session.ended` — `{ agentId, userId, durationSeconds, reason }`
- `canvas.show.invoked` — `{ agentId, intentLength, contextSizeBytes }`
- `canvas.subagent.latencyMs` — distribution per call
- `canvas.subagent.error` — `{ reason, agentId }`
- `canvas.stream.disconnects` — how often receivers lose the SSE stream

The receiver itself sends a one-shot `canvas.heartbeat` every 30 s while live, so the backend can detect zombie sessions where the SSE write succeeded but the receiver is gone.

## Migration from prior agent-canvas overlay

A stub canvas overlay previously lived at `apps/mobile/app/(app)/agents/[id]/canvas.tsx` — a full-screen black surface with placeholder cast/airplay/fullscreen buttons attached to the agent chat screen. It was removed when the canvas was promoted to a top-level tab and a separate receiver app. No data or routes need migration; nothing depended on the old overlay.

## v1 minimum-cut

- A2UI schema as the canvas UI vocabulary
- AG-UI endpoint on the Gremlin backend (`/canvas/sse` + companion POST endpoints)
- AG-UI client + A2UI React renderer in `apps/canvas`
- Scoped canvas session tokens issued by the backend
- `canvas.show(intent, context)` and `canvas.clear()` tools available to all agents
- UI subagent (Haiku) with A2UI system prompt + few-shot examples
- Last-state persistence per `(agentId, userId)` for splash continuity
- Mobile cast tab with real device discovery (`react-native-google-cast`)
- Telemetry events listed above
- Browser-mode signed link for non-cast viewers
- All five lifecycle states styled (boot / connecting / live / reconnecting / error) — required for Cast review

## Open questions

- **Token refresh handoff** — if the mobile sender disconnects mid-session, does the receiver shut down gracefully or attempt to keep going on the last token until expiry? Current lean: shut down on sender disconnect to keep the lifecycle simple.
- **Multi-viewer.** Should two phones be able to control one canvas? Cast supports it natively; A2UI doesn't have an opinion. Defer.
- **A2UI spec churn.** A2UI is brand new (Google launched 2026). Pin a version; expect API changes through the year.
- **Component coverage.** The A2UI vocabulary may not cover every artifact agents want to surface. Strategy: prefer the standard vocabulary; only extend if A2UI itself doesn't add the missing piece in a reasonable timeframe.
- **Skill-contributed components.** Should skills be able to register custom A2UI components (e.g., a github skill ships a PR-card component)? Powerful but breaks the no-code-execution safety property. Probably no.
- **Idle timeout duration.** 5 min is a guess. Tune based on real session telemetry.
- **CDN region.** CloudFront is global, but a receiver-fetched bundle in low-bandwidth regions may take seconds to boot. Worth measuring before publication.
- **Cost ceiling on UI subagent.** Haiku is cheap but `canvas.show` could be called frequently by chatty agents. Consider a per-agent rate limit and/or a "no-LLM" deterministic path for simple structured data.
