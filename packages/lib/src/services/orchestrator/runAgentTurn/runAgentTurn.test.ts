import type { ModelMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { scriptedModel } from "../../__testing__/scriptedModel/index.js";

// Isolate runAgentTurn to its core responsibility: drive streamText with the model,
// wire onChunk/pubsub, and write the final AGENT log. Everything around it stays mocked.
vi.mock("../writeAgentLog.js", () => ({
  writeAgentLog: vi.fn().mockResolvedValue({ id: "log-1", createdAt: "t" }),
  updateAgentLogResult: vi.fn(),
}));

vi.mock("./onStepFinish.js", () => ({
  createOnStepFinish: () => async () => {},
}));

vi.mock("./withEagerLogging.js", () => ({
  withEagerLogging: (tools: Record<string, unknown>) => ({
    tools,
    callLogIds: new Map(),
  }),
}));

vi.mock("./streamSpeech.js", () => ({
  createSpeechPipeline: () => ({
    pushText: () => {},
    finish: () => {},
  }),
}));

const { runAgentTurn } = await import("./index.js");
const { writeAgentLog } = await import("../writeAgentLog.js");

function makeCtx() {
  // mockDeep provides vi.fn() for every method, so pubsub.publish is already a spy.
  return createMockContext();
}

function userMsg(content: string): ModelMessage {
  return { role: "user", content };
}

describe("runAgentTurn with scriptedModel", () => {
  let ctx: ReturnType<typeof makeCtx>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = makeCtx();
  });

  it("returns the scripted text response and writes a final AGENT log", async () => {
    ctx.modelOverride = {
      model: scriptedModel([[{ kind: "text", text: "hi there" }]]),
    };

    const result = await runAgentTurn(ctx, {
      agentId: "agent-1",
      taskId: null,
      systemPrompt: "You are a test agent.",
      messages: [userMsg("hello")],
    });

    expect(result).toBe("hi there");
    expect(writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        agentId: "agent-1",
        taskId: null,
        role: "AGENT",
        content: "hi there",
      }),
    );
  });

  it("streams text deltas through pubsub in order", async () => {
    ctx.modelOverride = {
      model: scriptedModel([
        [
          { kind: "text", text: "part one " },
          { kind: "text", text: "part two" },
        ],
      ]),
    };

    await runAgentTurn(ctx, {
      agentId: "agent-1",
      taskId: null,
      systemPrompt: "sys",
      messages: [userMsg("hi")],
    });

    const publishes = (
      ctx.resources.pubsub.publish as unknown as {
        mock: { calls: unknown[][] };
      }
    ).mock.calls;
    const deltas = publishes
      .map((call) => call[1] as { delta: string; done: boolean })
      .filter((p) => !p.done && p.delta !== "")
      .map((p) => p.delta);

    expect(deltas).toEqual(["part one ", "part two"]);
  });

  it("does not write a final AGENT log when the model returns empty text", async () => {
    ctx.modelOverride = {
      model: scriptedModel([[{ kind: "text", text: "" }]]),
    };

    const result = await runAgentTurn(ctx, {
      agentId: "agent-1",
      taskId: "task-1",
      systemPrompt: "sys",
      messages: [userMsg("hi")],
    });

    expect(result).toBe("");
    expect(writeAgentLog).not.toHaveBeenCalled();
  });
});
