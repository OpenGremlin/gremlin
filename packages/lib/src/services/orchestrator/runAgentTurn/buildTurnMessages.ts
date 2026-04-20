import type { ModelMessage } from "ai";
import type { CacheMarkerOptions } from "../model/cacheMarkers.js";

// Cast CacheMarkerOptions (our loose Record<string, Record<string, unknown>>)
// to the SDK's stricter `SharedV3ProviderOptions` shape. Our values are always
// JSON-compatible primitives — the structural cast is safe in practice and
// avoids a build-time dep on the internal `@ai-sdk/provider` package.
type ProviderOptionsCast = NonNullable<ModelMessage["providerOptions"]>;

interface BuildTurnMessagesInput {
  /** The stable, cacheable system prompt (agent identity, tools, etc.). */
  systemPrompt: string;
  /** Dynamic recall (journals, relevant memories) — kept outside the cache. */
  memoryContext?: string;
  /** Prior conversation turns from DDB. */
  history: ModelMessage[];
  /** Provider options to attach to the system message (e.g. 1h cache point). */
  systemCache?: CacheMarkerOptions;
  /** Provider options to attach to the last assistant message (e.g. 5m cache). */
  rollingCache?: CacheMarkerOptions;
}

/**
 * Compose the messages array passed to streamText for a single agent turn.
 *
 * Layout is:
 *
 *   [system]            ← stable, carries the system cache marker
 *   [user: memory]?     ← dynamic recalled context, outside the cache
 *   ...history          ← ddb-backed conversation
 *   [assistant: last]   ← carries the rolling cache marker (next turn's hit)
 *
 * Determinism matters here: the same inputs must produce the same bytes on
 * every turn, because any drift invalidates the cache. Callers pass already-
 * stable `history` (the caller is responsible for serializing tool entries
 * deterministically); this function only composes.
 */
export function buildTurnMessages(input: BuildTurnMessagesInput): {
  messages: ModelMessage[];
} {
  const messages: ModelMessage[] = [];

  const systemMsg: ModelMessage = {
    role: "system",
    content: input.systemPrompt,
  };
  if (input.systemCache) {
    systemMsg.providerOptions = input.systemCache as ProviderOptionsCast;
  }
  messages.push(systemMsg);

  if (input.memoryContext) {
    messages.push({
      role: "user",
      content: `[Recalled context]\n${input.memoryContext}`,
    });
  }

  messages.push(...input.history);

  // Rolling breakpoint: attach to the last assistant message so next turn
  // gets a cache hit covering the full prior exchange.
  if (input.rollingCache) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        messages[i] = {
          ...messages[i],
          providerOptions: input.rollingCache as ProviderOptionsCast,
        };
        break;
      }
    }
  }

  return { messages };
}
