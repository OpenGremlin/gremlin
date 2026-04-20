import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import { asCacheCapableProvider, cacheMarker } from "../model/cacheMarkers.js";
import { buildTurnMessages } from "./buildTurnMessages.js";

/**
 * These tests exist to catch cache-busting regressions. The #1 way prompt
 * caching silently breaks is serialization drift in the prefix — so we
 * assert byte-level stability, placement of markers, and that dynamic
 * content stays *out* of the cached region.
 */
describe("buildTurnMessages", () => {
  const history: ModelMessage[] = [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi there" },
    { role: "user", content: "what's up?" },
    { role: "assistant", content: "not much" },
  ];

  it("produces byte-identical messages when inputs are identical", () => {
    const call = () =>
      JSON.stringify(
        buildTurnMessages({
          systemPrompt: "stable identity",
          memoryContext: "recent journal",
          history,
          systemCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
          rollingCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
        }).messages,
      );

    expect(call()).toBe(call());
  });

  it("attaches the cache marker to the system message on bedrock", () => {
    const { messages } = buildTurnMessages({
      systemPrompt: "stable identity",
      history,
      systemCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
    });

    expect(messages[0].role).toBe("system");
    expect(messages[0].providerOptions).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "5m" } },
    });
  });

  it("attaches the rolling marker to the last assistant message", () => {
    const { messages } = buildTurnMessages({
      systemPrompt: "sys",
      history,
      rollingCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
    });

    // history[3] is the last assistant — it moves to messages[4] (after system).
    expect(messages[4].role).toBe("assistant");
    expect(messages[4].content).toBe("not much");
    expect(messages[4].providerOptions).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "5m" } },
    });
    // Earlier assistant message must NOT carry a marker.
    expect(messages[2].role).toBe("assistant");
    expect(messages[2].providerOptions).toBeUndefined();
  });

  it("does not attach any markers when caches are undefined (non-bedrock/anthropic)", () => {
    // asCacheCapableProvider returns null for openai → caller passes undefined.
    expect(asCacheCapableProvider("openai")).toBeNull();
    const { messages } = buildTurnMessages({
      systemPrompt: "sys",
      memoryContext: "mem",
      history,
      systemCache: undefined,
      rollingCache: undefined,
    });

    for (const m of messages) {
      expect(m.providerOptions).toBeUndefined();
    }
  });

  it("keeps memoryContext OUT of the system message (cache invariant)", () => {
    const { messages } = buildTurnMessages({
      systemPrompt: "stable identity",
      memoryContext: "dynamic memory that changes each turn",
      history: [],
      systemCache: cacheMarker("amazon-bedrock"),
    });

    // The system message content must be exactly the stable prompt.
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("stable identity");
    // The dynamic memory lives in a separate, non-cached user message.
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "dynamic memory that changes each turn",
    );
    expect(messages[1].providerOptions).toBeUndefined();
  });

  it("system bytes stay stable even when memory/history change", () => {
    const a = buildTurnMessages({
      systemPrompt: "stable identity",
      memoryContext: "memory A",
      history: [{ role: "user", content: "msg A" }],
      systemCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
    }).messages;
    const b = buildTurnMessages({
      systemPrompt: "stable identity",
      memoryContext: "memory B",
      history: [
        { role: "user", content: "msg A" },
        { role: "assistant", content: "reply" },
        { role: "user", content: "msg B" },
      ],
      systemCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
    }).messages;

    // System message (bytes-exact) must be identical regardless of history/memory.
    expect(JSON.stringify(a[0])).toBe(JSON.stringify(b[0]));
  });

  it("rolling marker is a no-op when there is no assistant history yet", () => {
    const { messages } = buildTurnMessages({
      systemPrompt: "sys",
      history: [{ role: "user", content: "first message" }],
      rollingCache: cacheMarker("amazon-bedrock", { ttl: "5m" }),
    });
    // Just [system, user] — neither should carry the rolling marker.
    expect(messages).toHaveLength(2);
    expect(messages[1].providerOptions).toBeUndefined();
  });
});
