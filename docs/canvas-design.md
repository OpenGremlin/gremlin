# Canvas

A live, agent-driven UI surface that runs in a browser tab or on a Chromecast. Agents push structured UI descriptions; the canvas renders them. The mobile app is the controller — it picks the cast device, holds auth, and brokers the session.

## Motivation

Agents produce visual artifacts (charts, images, code, data tables, walkthroughs) that today live as text inside a chat thread. The canvas surfaces them on a bigger screen so the agent's output becomes ambient — visible at a glance, controllable from the phone, and naturally suited to demos, monitoring, and shared viewing.

Cast support is the headline delivery channel, but the canvas is also just a webpage — anyone can open it in a browser tab and get the same view.

### Non-goals for v1

- **No remote control surface.** The canvas displays agent output. Touch/gesture interaction passthrough is out of scope.
- **No screen mirror.** The canvas is its own page rendering its own React tree from server-pushed state, not a video stream of the mobile app.
- **No multi-viewer.** One phone driving one canvas. Cast technically supports multiple senders; deferred.
- **No audio.** Cast supports audio streams; the canvas doesn't use them.
- **No offline mode.** Receiver requires a live AG-UI stream. If the connection drops past the reconnect budget, it shows an error state.
- **No per-deployment UX bundles.** All deployments share one canvas app (hosted at `ogcaster.com`). If the canvas doesn't support a component, agents can't emit it. Theming and server-side composition templates cover the real customization needs; true code-level customization is a Tier-3 escape hatch (deferred).

## Architecture

```
 Mobile               Cast device                  Gremlin backend
 (sender)             ogcaster.com                 (per deployment)
 ──────               ────────────                 ──────────────

 user taps cast
       ↓
 Cast SDK discovers
       ↓
 launches App ID  →  loads ogcaster.com
                     (self-contained canvas app)
                          ↓
 sends {           →   canvas boots with session
   backendUrl,
   token,
   agentId,
   sessionId
 }
                        opens AG-UI SSE stream  ──────→  /canvas/sse
                             ↑                               ↑
                             │                     agent calls canvas.show()
                             │                               ↓
                             │                     UI subagent (Haiku)
                             │                     emits A2UI tree
                             └──── A2UI events ──────────────┘
```

Three things in motion:

- **Cast** wires the mobile app to a TV-class browser running the canvas page.
- **AG-UI** is the bi-directional event stream between the canvas and the deployment's Gremlin backend.
- **A2UI** is the declarative UI schema agents emit, which AG-UI carries and the canvas renders.

## Hosting

The canvas is a single app deployed once to **`ogcaster.com`** — a domain the opengremlin control plane owns. Every deployment (managed or self-hosted) uses the same canvas; the only per-deployment inputs are the `backendUrl`, `token`, and `agentId` passed in the Cast launch message.

### Why a separate eTLD+1

`ogcaster.com` is a different eTLD+1 from `opengremlin.com` and from any customer domain:

- **Cookie isolation.** No auth cookies exist on the canvas origin. An XSS in the canvas can't reach cookies set on opengremlin or customer domains. Industry pattern — GitHub → `githubusercontent.com`, Google → `googleusercontent.com`.
- **Cast App ID permanence.** The registered URL is bound to the App ID forever. Putting it under a different TLD decouples it from opengremlin.com's DNS story.

### Why one app, not a bootloader + per-deployment bundle

An earlier design had the canvas as a thin bootloader at ogcaster.com that dynamically imported a per-deployment bundle. That was dropped because:

- **Google Cast policy §3.4.1** requires "appropriate steps to ensure that your application cannot be invoked to launch content for which you are not responsible." A sender-supplied `bundleUrl` is exactly what the policy prohibits.
- **Complexity tax.** Signed URLs, origin allowlists, CORS on every customer CloudFront, bundle-contract versioning — all needed to make the bootloader safe.
- **Customization demand is modest.** Theming + server-provided component compositions cover the common cases. True code-level customization is rare enough to justify the Tier-3 escape hatch instead of a default path.

### Infra

The canvas lives in the closed-source control plane repo (`gremlin-web/packages/canvas`) and is deployed by `gremlin-web/packages/infra/lib/canvas-stack.ts`:

- Dedicated Route 53 hosted zone for `ogcaster.com`
- ACM cert (DNS-validated via Route 53)
- S3 bucket (BLOCK_ALL + OAC)
- CloudFront distribution with SPA fallbacks (403/404 → `/index.html`), short 5-min TTL so urgent fixes propagate quickly

The CloudFormation stack ID is `GremlinCanvasBootloaderStack` (historical — the stack was initially created when the design was still a bootloader). The name stays because renaming would tear down the hosted zone and invalidate the registrar's NS record configuration.

## Cast registration

Steps to register the canvas as a Custom Receiver in the Google Cast SDK Developer Console:

1. Sign up for the Cast SDK Developer Console (one-time $5 fee).
2. Register the dev/test Chromecast device by serial number — unpublished receivers only run on whitelisted devices.
3. Create a Custom Receiver app pointing at `https://ogcaster.com`. The console returns a permanent **Application ID** (e.g. `ABCD1234`) that mobile senders use to launch the receiver.
4. Reboot the registered device so it picks up the whitelist (~15-min propagation).
5. For public release, submit for publication review (weeks-long, manual). Until then the receiver works on whitelisted devices only — fine for dev, beta, or self-hosters.

## Auth and session bootstrap

The canvas loads with no auth context. The mobile app, which is already authenticated to its deployment's Gremlin backend, brokers the session.

Sequence on cast start:

1. Mobile asks its backend for a **scoped canvas session token** — short-lived (~5 min), refreshable, scoped to one `(agentId, sessionId)` pair. Not full account access.
2. Mobile launches the receiver via Cast App ID. The canvas loads from `ogcaster.com`.
3. Mobile sends `{ version, backendUrl, token, agentId, sessionId }` to the canvas as the first custom message on namespace `urn:x-cast:com.opengremlin.canvas`.
4. Canvas opens an AG-UI stream to `${backendUrl}/canvas/sse` with the token in the `Authorization` header (or `?t=` query param, since SSE can't send custom headers from the browser — see Streaming semantics).
5. On token expiry, canvas requests a refresh from the sender over the same custom-message channel.

Why scoped tokens: the Cast device is in someone's home but it's still arbitrary hardware. A leaked token can only do canvas operations against one session, not impersonate the user.

### Browser-only mode

The same canvas page works in a regular browser tab — no Cast involved. This is the dev path and a fallback for users without a Cast device.

In browser mode, the canvas reads `backend`, `t`, `agent`, and optional `session` from URL query params instead of a Cast custom message:

```
https://ogcaster.com/?
  backend=https%3A%2F%2Fgremlin.acme.com&
  agent=AGT_42&
  t=<scoped-token>
```

Same auth model, same AG-UI stream, same renderer.

## Transport: AG-UI

[AG-UI](https://docs.ag-ui.com/) is an open protocol for streaming events between an agentic backend and a frontend. Events flow over Server-Sent Events (server → client) with companion HTTP POST endpoints for client → server actions.

Why AG-UI rather than rolling our own over `graphql-ws`:

- **Purpose-built.** AG-UI defines lifecycle, state-patch, tool-call, and message events. Re-implementing on top of GraphQL subscriptions would be a meaningful rebuild.
- **SSE-friendly through CDNs and proxies.** CloudFront passes SSE through cleanly; corporate networks rarely block it the way they block WebSockets.
- **Survives sender sleep.** SSE is server → client push, so the canvas doesn't depend on mobile staying foregrounded. The Cast session can outlive the phone going to sleep.

AG-UI runs **alongside** the existing GraphQL stack on the backend, not as a replacement. A new endpoint (`/canvas/sse` + companion POST endpoints) is added to the Gremlin backend. Everything else continues to use GraphQL.

## UI schema: A2UI

[A2UI](https://a2ui.org/) is Google's declarative UI protocol for agent-driven interfaces. Agents emit a flat list of components with ID references; the canvas maps each component to a native widget. A2UI explicitly does not support arbitrary code execution — agents emit declarative trees, not JS.

Why A2UI rather than rolling a custom component schema:

- **LLM-friendly.** Designed to be incrementally generated, self-corrected mid-stream, and partially rendered.
- **Standard vocabulary.** Avoids reinventing `text`, `image`, `code`, `chart`, `stack`, `card`.
- **Safety.** The no-code-execution property is the exact property that keeps the canvas safe to host on a shared origin across all deployments.
- **React renderer.** The A2UI React renderer lands directly into our Vite + React app.

A2UI rides on top of AG-UI — agents emit A2UI trees, AG-UI streams them as state-patch events.

### Streaming semantics

Each canvas update carries a monotonic `revision` number. The wire protocol leans on AG-UI's standard event types:

- `RUN_STARTED` — UI subagent began producing a new tree
- `STATE_DELTA` — partial A2UI tree fragment; canvas merges by component ID
- `RUN_FINISHED` — tree complete; canvas may transition out of any "rendering" state
- `STATE_SNAPSHOT` — full A2UI tree, used on initial connect and reconnects

Because A2UI components are addressed by ID, the canvas can apply deltas mid-stream and the partial state is always renderable.

## Tool surface

The task agent does not know A2UI exists. It sees an intent-shaped tool:

```ts
canvas.show(intent: string, context?: Json)
canvas.clear()
```

The agent describes *what* it wants to surface ("show the chart I generated comparing Q1 vs Q2 revenue") and hands over whatever raw data it has. It doesn't lay out components, pick fonts, or reason about hierarchy.

### Tool semantics

| Aspect | Behavior |
|---|---|
| Return value | `{ rendered: true, revision }` on success; `{ rendered: false, reason }` on failure. Agent gets a confirmation it can reference. |
| Idempotency | Each call replaces the canvas root. Append/merge semantics are not v1. |
| Error path | UI subagent failure surfaces as a tool error to the task agent, not as a broken canvas. The canvas keeps showing whatever it had. |
| No active session | Tool succeeds and writes to persisted last-state; no live receiver is updated. Next cast session picks up the persisted state. |
| Always available | Every agent gets `canvas.show` and `canvas.clear`. No opt-in flag. The system prompt nudges sparing use. |

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
 Canvas renders incrementally
```

Why a subagent rather than letting the task agent emit A2UI directly:

- **Focus.** Task agents reason about tasks. Bloating their system prompt with A2UI vocabulary is dead weight on every reasoning step.
- **Single source of UI judgment.** Layout, hierarchy, and emphasis live in one prompt. Iterate on visual style without touching task agents.
- **Cheap model fits the job.** Translation suits Haiku; reasoning suits Sonnet/Opus.
- **Stateless per invocation.** Avoids canvas-state drift across the task agent's multi-turn reasoning.

### Fast path for the obvious cases

Trivial intents — "show this image", "show this code block" — short-circuit through a deterministic intent → A2UI mapper. No LLM call. The UI subagent only fires for ambiguous "compose something nice from this data" cases.

## Customization tiers

What a deployment can change without forking the canvas:

**Tier 1: Theme config.** Send a theme event at session start over AG-UI — colors, fonts, logo, accent, copy strings. The canvas honors it. Covers brand matching.

**Tier 2: Composition templates.** A deployment registers A2UI composites in its backend (built from primitives, referenced by ID). The agent calls `canvas.show` with a template ID; the backend expands it against the primitive set before streaming. A2UI macros, essentially — no JS execution, still safe.

**Tier 3 (deferred): Fork your own.** A deployment that genuinely needs novel component types or custom renderers forks the canvas app, customizes it, hosts it themselves, and registers their own Cast Receiver App ID with Google ($5 + review). Not supported in v1; revisit if a real customer asks.

## Initial trigger

Agents decide when to surface things. The system prompt nudges them: "when you produce visual artifacts, call `canvas.show`." Users can also ask explicitly ("put that on the canvas") — the agent translates to a tool call. One pathway, two ways to invoke it.

What appears when the user first casts: persist the **last canvas state** per `(agentId, userId)`. If nothing has been shown yet, render a branded splash ("Waiting for <agent name>"). Avoid blank screens — also a Cast review requirement.

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

The canvas moves through a small state machine:

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
| `connecting` | Have backend URL + token, AG-UI stream not yet open | "Connecting to <agent>…" |
| `live` | AG-UI stream open, latest A2UI tree rendering | Agent content |
| `idle` | No `canvas.show` call for > 5 min | Last tree dimmed; subtle "idle" indicator |
| `reconnecting` | Stream dropped; retry budget not exhausted | Last tree visible; "Reconnecting…" toast |
| `error` | Token refresh failed, retry budget exhausted, or backend rejects | Branded error screen with "Recast from your phone" |

Cast review requires every one of these to be a styled, branded screen — never a blank page or a raw error string.

## Reconnection and recovery

- **SSE reconnect** — exponential backoff up to 30 s, capped at 5 attempts before surfacing `error`.
- **State recovery on reconnect** — canvas requests a `STATE_SNAPSHOT` (current persisted A2UI tree) so it doesn't have to wait for the next `canvas.show` to repopulate.
- **Token expiry** — canvas detects a 401, asks the sender for a refresh via Cast custom message. If the sender is unreachable, canvas transitions to `error` after one attempt.
- **Sender disconnect** — Cast session ends, the canvas page is destroyed by the Cast device. No graceful shutdown needed; the persisted state remains for the next session.

## Phone controls

Two layers, only the first is in scope for v1:

- **Session control** — start/stop cast, switch which agent the canvas is bound to, blank the screen.
- **UI interaction** (later) — scroll, zoom, select, sent as commands over the same Cast custom-message channel back to the canvas, which forwards to the backend as mutations.

Most agent UIs are read-only "look what I made" content. Resist building a remote-control surface on day one.

### Mobile cast experience

The mobile **Canvas** tab sits between Jobs and Files in the bottom tab bar (lucide `Cast` icon). The screen has three states:

1. **Searching** — when no devices are visible. Spinner + "Searching for devices."
2. **Device list** — discovered Cast/AirPlay devices. Tapping one starts a session and the row shows a connecting indicator.
3. **Connected** — shows the live cast target, which agent is bound, and controls: switch agent, blank screen, disconnect.

Discovery uses `react-native-google-cast` (Chromecast) and `AVRoutePickerView` (AirPlay on iOS). Both require an Expo prebuild + dev-client rebuild — they are native modules that can't run in Expo Go.

The mobile app also surfaces a **cast indicator** in the global header when a session is active, so the user can disconnect from anywhere in the app, not only the Canvas tab.

## Canvas app structure

`gremlin-web/packages/canvas` (Vite + React):

```
packages/canvas/
├── index.html              # loads the CAF SDK from gstatic in <head>
├── src/
│   ├── main.tsx            # mounts React
│   ├── App.tsx             # state machine + A2UI renderer
│   ├── cast.ts             # CAF receiver listener (no-op in browser)
│   ├── session.ts          # parses sender message OR URL params
│   ├── agui.ts             # AG-UI SSE client + reconnect logic
│   ├── types.ts            # CanvasSession shape
│   └── index.css           # base styles, dark stage, splash
└── vite.config.ts
```

The bundle is intentionally small. No GraphQL client, no Apollo, no router — the canvas does one thing.

## Telemetry and observability

The Gremlin backend logs canvas events the same way it logs other agent activity:

- `canvas.session.started` — `{ agentId, userId, deviceModel }`
- `canvas.session.ended` — `{ agentId, userId, durationSeconds, reason }`
- `canvas.show.invoked` — `{ agentId, intentLength, contextSizeBytes }`
- `canvas.subagent.latencyMs` — distribution per call
- `canvas.subagent.error` — `{ reason, agentId }`
- `canvas.stream.disconnects` — how often canvases lose the SSE stream

The canvas itself sends a one-shot `canvas.heartbeat` every 30 s while live, so the backend can detect zombie sessions where the SSE write succeeded but the canvas is gone.

## v1 minimum-cut

- Canvas app deployed at `ogcaster.com` via `gremlin-web`'s `CanvasStack`
- Registered with Google as a Cast Custom Receiver; whitelisted dev device for testing; publication review deferred
- A2UI vocabulary as the canvas UI schema
- AG-UI endpoint on the Gremlin backend (`/canvas/sse` + companion POST endpoints)
- AG-UI client + A2UI React renderer in the canvas app
- Scoped canvas session tokens issued by the backend
- `canvas.show(intent, context)` and `canvas.clear()` tools available to all agents
- UI subagent (Haiku) with A2UI system prompt + few-shot examples
- Last-state persistence per `(agentId, userId)` for splash continuity
- Mobile cast tab with real device discovery (`react-native-google-cast`)
- Telemetry events listed above
- Browser-mode signed link for non-cast viewers
- All five lifecycle states styled — required for Cast review

## Open questions

- **Token refresh handoff** — if the mobile sender disconnects mid-session, does the canvas shut down gracefully or attempt to keep going on the last token until expiry? Current lean: shut down on sender disconnect to keep the lifecycle simple.
- **SSE auth header** — browser `EventSource` can't set custom headers. Options: token in query string (`?t=`), token in cookie, or use `fetch()` streaming instead of EventSource. Lean: `?t=` for simplicity plus short TTL, but keep tokens out of access logs.
- **Multi-viewer.** Should two phones be able to control one canvas? Defer.
- **A2UI spec churn.** A2UI is brand new (Google launched 2026). Pin a version; expect API changes through the year.
- **Component coverage.** The A2UI vocabulary may not cover every artifact agents want to surface. Strategy: prefer the standard vocabulary; extend via Tier-2 composites if A2UI itself doesn't add the missing piece.
- **When do we enable Tier-3?** The current design defers customer-run forked canvases. Revisit when a real customer has an irreducible need for a custom component type.
- **Idle timeout duration.** 5 min is a guess. Tune based on real session telemetry.
- **CDN region.** CloudFront is global, but a canvas-fetched in low-bandwidth regions may take seconds to boot. Worth measuring before publication.
- **Cost ceiling on UI subagent.** Haiku is cheap but `canvas.show` could be called frequently by chatty agents. Consider a per-agent rate limit and/or a "no-LLM" deterministic path for simple structured data.
