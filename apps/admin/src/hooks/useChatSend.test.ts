import { act, renderHook } from "@testing-library/react";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth", () => ({
  gql: vi.fn(),
  getToken: vi.fn(),
}));

import { gql } from "../auth";
import { useChatSend } from "./useChatSend";

const mockGql = gql as Mock;

function makeUserMsg(content: string) {
  return {
    id: `msg-${content}`,
    role: "USER" as const,
    content,
    createdAt: new Date().toISOString(),
    toolName: null,
    toolInput: null,
    toolResult: null,
    taskId: null,
    agent: { id: "a1", name: "Bot", avatar: "", imageUrl: "", portraitId: "", soul: "", retired: false },
  };
}

beforeEach(() => {
  mockGql.mockReset();
});

describe("useChatSend", () => {
  it("adds pending message on send and clears input", async () => {
    mockGql.mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useChatSend({ agentId: "a1", messages: [] }),
    );

    act(() => result.current.setInput("hello"));
    expect(result.current.input).toBe("hello");

    await act(() => result.current.handleSend());

    expect(result.current.input).toBe("");
    expect(result.current.pendingMessages).toContain("hello");
  });

  it("does not send empty or whitespace-only input", async () => {
    const { result } = renderHook(() =>
      useChatSend({ agentId: "a1", messages: [] }),
    );

    act(() => result.current.setInput("   "));
    await act(() => result.current.handleSend());

    expect(mockGql).not.toHaveBeenCalled();
    expect(result.current.pendingMessages).toHaveLength(0);
  });

  it("clears pending when matching message appears in messages", async () => {
    mockGql.mockResolvedValueOnce({});

    const { result, rerender } = renderHook(
      ({ messages }: { messages: any[] }) =>
        useChatSend({ agentId: "a1", messages }),
      { initialProps: { messages: [] as any[] } },
    );

    act(() => result.current.setInput("hello"));
    await act(() => result.current.handleSend());
    expect(result.current.pendingMessages).toContain("hello");

    rerender({ messages: [makeUserMsg("hello")] });
    expect(result.current.pendingMessages).not.toContain("hello");
  });

  it("removes pending message on send failure", async () => {
    mockGql.mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() =>
      useChatSend({ agentId: "a1", messages: [] }),
    );

    act(() => result.current.setInput("hello"));
    await act(() => result.current.handleSend());

    expect(result.current.pendingMessages).not.toContain("hello");
  });

  it("includes taskId in mutation when provided", async () => {
    mockGql.mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useChatSend({ agentId: "a1", taskId: "t1", messages: [] }),
    );

    act(() => result.current.setInput("hello"));
    await act(() => result.current.handleSend());

    expect(mockGql).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ agentId: "a1", taskId: "t1", content: "hello" }),
    );
  });
});
