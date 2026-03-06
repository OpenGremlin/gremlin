import { describe, expect, it } from "vitest";
import { type ChatMessage, shouldShowTimestamp } from "./useLogMessages";

function makeMsg(
  overrides: Partial<ChatMessage> & { role: ChatMessage["role"] },
): ChatMessage {
  return {
    id: "1",
    content: "hello",
    createdAt: "2024-01-01T12:00:00Z",
    toolName: null,
    toolInput: null,
    toolResult: null,
    taskId: null,
    agent: { id: "a1", name: "Bot", avatar: "", imageUrl: "", portraitId: "", soul: "", retired: false },
    ...overrides,
  } as ChatMessage;
}

describe("shouldShowTimestamp", () => {
  it("returns true when there is no next message", () => {
    expect(shouldShowTimestamp(makeMsg({ role: "USER" }), undefined)).toBe(true);
  });

  it("returns true when roles differ", () => {
    const msg = makeMsg({ role: "USER" });
    const next = makeMsg({ role: "AGENT" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("returns false for same role within 1 minute", () => {
    const msg = makeMsg({ role: "USER", createdAt: "2024-01-01T12:00:00Z" });
    const next = makeMsg({ role: "USER", createdAt: "2024-01-01T12:00:30Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(false);
  });

  it("returns true for same role with >= 1 minute gap", () => {
    const msg = makeMsg({ role: "USER", createdAt: "2024-01-01T12:00:00Z" });
    const next = makeMsg({ role: "USER", createdAt: "2024-01-01T12:01:00Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("uses absolute gap (handles out-of-order timestamps)", () => {
    const msg = makeMsg({ role: "AGENT", createdAt: "2024-01-01T12:01:30Z" });
    const next = makeMsg({ role: "AGENT", createdAt: "2024-01-01T12:00:00Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });
});
