# Test helpers for `packages/lib`

## `createMockContext()` — `mockContext.ts`

Returns a `mockDeep<ServiceContext>`. Default for most unit tests:

```ts
const ctx = createMockContext();
ctx.services.memory.recallMemories.mockResolvedValue({ recent: [], relevant: [] });
```

Every nested field (services, resources, log, loaders) is auto-mocked as a proxy.
Set individual call returns with `.mockResolvedValue(...)` / `.mockReturnValue(...)`.

## `scriptedModel(turns)` — `scriptedModel/`

A fake `LanguageModel` that replays a fixed sequence of turns. Use this when you want
the **real** orchestrator code (`runAgentTurn`, `streamText`, `onStepFinish`) to run
against deterministic LLM output.

Each turn is one array of steps. The AI SDK calls the model once per turn when looping
through tool calls — so pass one turn per round-trip.

```ts
import { scriptedModel } from "../../__testing__/scriptedModel/index.js";

const model = scriptedModel([
  // Turn 1: the model asks to call a tool
  [{ kind: "toolCall", toolName: "shell", input: { cmd: "ls" } }],
  // Turn 2: after the tool runs, the model produces the final text
  [{ kind: "text", text: "All done." }],
]);

ctx.modelOverride = { model };
// Or, to exercise compaction paths, supply the limit too:
// ctx.modelOverride = { model, maxInputTokens: 1000 };

const result = await runAgentTurn(ctx, { ... });
```

`ctx.modelOverride` is a test-only slot on `ServiceContext`; when set, every model-
resolution function (`getModel`, `getModelForAgent`, `getModelResult`) returns it
instead of looking up Bedrock or a provider API.

`finishReason` is inferred from the turn's content: if any step is a `toolCall`,
the scripted model emits `finishReason: "tool-calls"` (signalling the SDK to loop
back after executing tools); otherwise `"stop"`.

### What's NOT scriptable yet

Tool **results** — the model drives the LLM side only. Tool execution happens inside
the AI SDK, against whatever real tools you pass to `streamText`. If you need
deterministic tool results, stub the tool's `execute` fn. Tool-result scripting is
deferred until the tool-result typing refactor lands.

### Multi-step stopping

When testing flows with tool calls, pass `stopWhen: stepCountIs(N)` to `streamText`
(or use the orchestrator's default `stopWhen` predicates). Otherwise the SDK defaults
may end the loop before your scripted turns have all been consumed.
