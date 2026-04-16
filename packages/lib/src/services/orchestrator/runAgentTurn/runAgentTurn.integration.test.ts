import { tool } from "ai";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { z } from "zod";
import { createMockContext } from "../../__testing__/mockContext.js";
import { scriptedModel } from "../../__testing__/scriptedModel/index.js";

// Unlike runAgentTurn.test.ts (which stubs withEagerLogging + onStepFinish wholesale),
// this file un-mocks the full tool-call pipeline. The scripted model emits a tool call,
// the real withEagerLogging wraps the tool's execute, the real onStepFinish finalizes
// the TOOL log entry. Only the persistence-layer writes are mocked.

vi.mock("../writeAgentLog.js", () => ({
  writeAgentLog: vi
    .fn()
    .mockImplementation(async () => ({ id: "log-new", createdAt: "t-new" })),
  updateAgentLogResult: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./streamSpeech.js", () => ({
  createSpeechPipeline: () => ({
    pushText: () => {},
    finish: () => {},
  }),
}));

const { runAgentTurn } = await import("./index.js");
const { writeAgentLog, updateAgentLogResult } = await import(
  "../writeAgentLog.js"
);

describe("runAgentTurn end-to-end tool pipeline", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
  });

  it("scripted tool-call → withEagerLogging writes input log → tool runs → onStepFinish updates log with result → final text", async () => {
    ctx.modelOverride = {
      model: scriptedModel([
        [
          {
            kind: "toolCall",
            toolName: "echo",
            input: { msg: "hello" },
            toolCallId: "call-xyz",
          },
        ],
        [{ kind: "text", text: "Done." }],
      ]),
    };

    const toolExecutions: unknown[] = [];
    const echoTool = tool({
      description: "Echo a message",
      inputSchema: z.object({ msg: z.string() }),
      execute: async ({ msg }) => {
        toolExecutions.push({ msg });
        return { echoed: msg };
      },
    });

    const result = await runAgentTurn(ctx, {
      agentId: "agent-1",
      taskId: "task-1",
      systemPrompt: "sys",
      messages: [{ role: "user", content: "please echo hello" }],
      tools: { echo: echoTool },
    });

    expect(result).toBe("Done.");
    expect(toolExecutions).toEqual([{ msg: "hello" }]);

    // withEagerLogging wrote the TOOL input log BEFORE the tool executed
    const toolInputLogCall = (writeAgentLog as Mock).mock.calls.find(
      (call) => call[1].role === "TOOL",
    );
    expect(toolInputLogCall?.[1]).toMatchObject({
      agentId: "agent-1",
      taskId: "task-1",
      role: "TOOL",
      toolName: "echo",
      toolInput: { msg: "hello" },
      toolResult: null,
    });

    // onStepFinish located the existing TOOL log via toolCallId and finalized it with the result
    expect(updateAgentLogResult).toHaveBeenCalledWith(
      ctx,
      "log-new",
      "t-new",
      expect.objectContaining({
        agentId: "agent-1",
        taskId: "task-1",
        toolName: "echo",
        toolInput: { msg: "hello" },
        toolResult: { echoed: "hello" },
      }),
    );

    // Final AGENT log with the scripted text
    const finalAgentLogCall = (writeAgentLog as Mock).mock.calls.find(
      (call) => call[1].role === "AGENT",
    );
    expect(finalAgentLogCall?.[1]).toMatchObject({
      role: "AGENT",
      content: "Done.",
    });
  });

  it("halts when stopWhen predicates fire (requestUserInput tool)", async () => {
    // The built-in requestUserInput tool is auto-injected; a toolCall with that name
    // should cause streamText to stop via hasToolCall("requestUserInput").
    ctx.modelOverride = {
      model: scriptedModel([
        [
          {
            kind: "toolCall",
            toolName: "requestUserInput",
            input: { question: "What's your name?" },
            toolCallId: "rui-1",
          },
        ],
      ]),
    };

    // requestUserInputTool is auto-added inside runAgentTurn; we don't pass it.
    // Give it enough steps to loop so stopWhen is really what halts us.
    const result = await runAgentTurn(ctx, {
      agentId: "agent-1",
      taskId: null,
      systemPrompt: "sys",
      messages: [{ role: "user", content: "ask me something" }],
    });

    // No final text — streamText halted before producing an assistant response
    expect(result).toBe("");
    // No final AGENT log written
    const agentLogCalls = (writeAgentLog as Mock).mock.calls.filter(
      (call) => call[1].role === "AGENT",
    );
    expect(agentLogCalls).toHaveLength(0);
  });
});
