import { tool } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { z } from "zod";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";

vi.mock("../writeAgentLog.js", () => ({
  writeAgentLog: vi.fn(),
  updateAgentLogResult: vi.fn(),
}));

import { writeAgentLog } from "../writeAgentLog.js";
import { withEagerLogging } from "./withEagerLogging.js";

const mockWriteAgentLog = vi.mocked(writeAgentLog);

function makeTool(body: (input: unknown) => unknown) {
  return tool({
    description: "fake",
    inputSchema: z.object({}).passthrough(),
    execute: async (input) => body(input),
  });
}

describe("withEagerLogging", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    mockWriteAgentLog.mockResolvedValue({
      id: "log-1",
      createdAt: "2026-04-16T00:00:00.000Z",
    } as any);
  });

  it("returns the same keys as the input set", () => {
    const tools = {
      foo: makeTool(() => "foo-ran"),
      bar: makeTool(() => "bar-ran"),
    };
    const { tools: wrapped } = withEagerLogging(
      tools,
      ctx,
      "agent-1",
      "task-1",
    );
    expect(Object.keys(wrapped).sort()).toEqual(["bar", "foo"]);
  });

  it("writes a TOOL log on call-start with input-only and no result", async () => {
    const tools = { echo: makeTool((input) => input) };
    const { tools: wrapped } = withEagerLogging(tools, ctx, "agent-1", "t1");

    await wrapped.echo.execute?.(
      { arg: 42 } as any,
      {
        toolCallId: "tc1",
        messages: [],
      } as any,
    );

    expect(mockWriteAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        agentId: "agent-1",
        taskId: "t1",
        role: "TOOL",
        toolName: "echo",
        toolInput: { arg: 42 },
        toolResult: null,
      }),
    );
  });

  it("registers the call log in callLogIds keyed by toolCallId", async () => {
    const tools = { echo: makeTool(() => "ok") };
    const { tools: wrapped, callLogIds } = withEagerLogging(
      tools,
      ctx,
      "agent-1",
      null,
    );

    await wrapped.echo.execute?.(
      {} as any,
      {
        toolCallId: "tc-xyz",
        messages: [],
      } as any,
    );

    expect(callLogIds.get("tc-xyz")).toEqual({
      logId: "log-1",
      createdAt: "2026-04-16T00:00:00.000Z",
    });
  });

  it("still passes input and options through to the wrapped tool", async () => {
    const inner = vi.fn(() => "inner-result");
    const tools = { echo: makeTool(inner) };
    const { tools: wrapped } = withEagerLogging(tools, ctx, "agent-1", null);

    const result = await wrapped.echo.execute?.(
      { x: 1 } as any,
      {
        toolCallId: "tc1",
        messages: [],
      } as any,
    );

    expect(inner).toHaveBeenCalledWith({ x: 1 });
    expect(result).toBe("inner-result");
  });

  it("works even when the AI SDK omits the toolCallId (no entry written to map)", async () => {
    const tools = { echo: makeTool(() => "ok") };
    const { tools: wrapped, callLogIds } = withEagerLogging(
      tools,
      ctx,
      "a",
      null,
    );
    await wrapped.echo.execute?.({} as any, { messages: [] } as any);
    expect(callLogIds.size).toBe(0);
  });
});
