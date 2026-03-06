import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let subscriptionCallback: ((data: any) => void) | null = null;

vi.mock("../wsClient", () => ({
  wsClient: {
    subscribe: (_payload: any, handler: any) => {
      subscriptionCallback = (data: any) => handler.next({ data });
      return vi.fn();
    },
  },
}));

import { useSandboxOutput } from "./useSandboxOutput";

beforeEach(() => {
  subscriptionCallback = null;
});

describe("useSandboxOutput", () => {
  it("accumulates output chunks per commandId", () => {
    const { result } = renderHook(() => useSandboxOutput("task-1"));

    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd1", stream: "stdout", data: "hello " },
      });
    });
    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd1", stream: "stdout", data: "world" },
      });
    });

    const stream = result.current.get("cmd1");
    expect(stream?.output).toBe("hello world");
    expect(stream?.done).toBe(false);
  });

  it("sets done and exitCode on completion", () => {
    const { result } = renderHook(() => useSandboxOutput("task-1"));

    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd1", stream: "stdout", data: "output" },
      });
    });
    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd1", stream: "stdout", data: "", done: true, exitCode: 0 },
      });
    });

    const stream = result.current.get("cmd1");
    expect(stream?.output).toBe("output");
    expect(stream?.done).toBe(true);
    expect(stream?.exitCode).toBe(0);
  });

  it("tracks multiple commands independently", () => {
    const { result } = renderHook(() => useSandboxOutput("task-1"));

    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd1", stream: "stdout", data: "first" },
      });
    });
    act(() => {
      subscriptionCallback!({
        sandboxOutput: { commandId: "cmd2", stream: "stdout", data: "second" },
      });
    });

    expect(result.current.get("cmd1")?.output).toBe("first");
    expect(result.current.get("cmd2")?.output).toBe("second");
  });
});
