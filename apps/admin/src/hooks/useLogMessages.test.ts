import { describe, expect, it } from "vitest";
import { AgentLogRole } from "../graphql/generated/graphql";
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
    agent: {
      id: "a1",
      name: "Bot",
      avatar: "",
      imageUrl: "",
      portraitId: "",
      soul: "",
      retired: false,
    },
    ...overrides,
  } as ChatMessage;
}

describe("shouldShowTimestamp", () => {
  it("returns true when there is no next message", () => {
    expect(
      shouldShowTimestamp(makeMsg({ role: AgentLogRole.User }), undefined),
    ).toBe(true);
  });

  it("returns true when roles differ", () => {
    const msg = makeMsg({ role: AgentLogRole.User });
    const next = makeMsg({ role: AgentLogRole.Agent });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("returns false for same role within 15 minutes", () => {
    const msg = makeMsg({
      role: AgentLogRole.User,
      createdAt: "2024-01-01T12:00:00Z",
    });
    const next = makeMsg({
      role: AgentLogRole.User,
      createdAt: "2024-01-01T12:14:00Z",
    });
    expect(shouldShowTimestamp(msg, next)).toBe(false);
  });

  it("returns true for same role with >= 15 minute gap", () => {
    const msg = makeMsg({
      role: AgentLogRole.User,
      createdAt: "2024-01-01T12:00:00Z",
    });
    const next = makeMsg({
      role: AgentLogRole.User,
      createdAt: "2024-01-01T12:15:00Z",
    });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("uses absolute gap (handles out-of-order timestamps)", () => {
    const msg = makeMsg({
      role: AgentLogRole.Agent,
      createdAt: "2024-01-01T12:01:30Z",
    });
    const next = makeMsg({
      role: AgentLogRole.Agent,
      createdAt: "2024-01-01T12:00:00Z",
    });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });
});
