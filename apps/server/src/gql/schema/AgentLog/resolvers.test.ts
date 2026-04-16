import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { agentLogResolvers } from "./resolvers.js";

describe("AgentLog resolvers", () => {
  beforeEach(() => vi.clearAllMocks());
  it("agentLogs forwards pagination args to the service", async () => {
    const page = { edges: [], pageInfo: { hasNextPage: false } };
    const ctx = buildTestContext();
    ctx.services.agentLogs.getAgentLogs = vi.fn().mockResolvedValue(page);

    const result = await invokeResolver(agentLogResolvers.Query.agentLogs, {
      args: {
        agentId: "a-1",
        first: 10,
        after: "cursor",
        last: null,
        before: null,
      },
      ctx,
    });

    expect(result).toBe(page);
    expect(ctx.services.agentLogs.getAgentLogs).toHaveBeenCalledWith(
      ctx,
      "a-1",
      { first: 10, after: "cursor", last: null, before: null },
    );
  });

  it("taskLogs looks up the task, then forwards agentId + pagination to the service", async () => {
    const task = { id: "t-1", agentId: "a-1" };
    const page = { edges: [], pageInfo: { hasNextPage: false } };
    const ctx = buildTestContext();
    ctx.loaders.taskLoader.load = vi.fn().mockResolvedValue(task);
    ctx.services.agentLogs.getTaskLogs = vi.fn().mockResolvedValue(page);

    const result = await invokeResolver(agentLogResolvers.Query.taskLogs, {
      args: { taskId: "t-1", first: 5, after: null, last: null, before: null },
      ctx,
    });

    expect(result).toBe(page);
    expect(ctx.loaders.taskLoader.load).toHaveBeenCalledWith("t-1");
    expect(ctx.services.agentLogs.getTaskLogs).toHaveBeenCalledWith(
      ctx,
      "t-1",
      { first: 5, after: null, last: null, before: null },
      "a-1",
    );
  });

  it("taskLogs tolerates a missing task and passes agentId=undefined", async () => {
    const page = { edges: [], pageInfo: { hasNextPage: false } };
    const ctx = buildTestContext();
    ctx.loaders.taskLoader.load = vi.fn().mockResolvedValue(null);
    ctx.services.agentLogs.getTaskLogs = vi.fn().mockResolvedValue(page);

    const result = await invokeResolver(agentLogResolvers.Query.taskLogs, {
      args: {
        taskId: "t-missing",
        first: 5,
        after: null,
        last: null,
        before: null,
      },
      ctx,
    });

    expect(result).toBe(page);
    expect(ctx.services.agentLogs.getTaskLogs).toHaveBeenCalledWith(
      ctx,
      "t-missing",
      { first: 5, after: null, last: null, before: null },
      undefined,
    );
  });

  it("sendMessage queues via orchestrator and echoes the content", async () => {
    const ctx = buildTestContext();
    ctx.services.orchestrator.sendMessage = vi
      .fn()
      .mockResolvedValue(undefined);

    const result = await invokeResolver(
      agentLogResolvers.Mutation.sendMessage,
      { args: { agentId: "a-1", content: "hello", taskId: null }, ctx },
    );

    expect(result).toEqual({ queued: true, content: "hello" });
    expect(ctx.services.orchestrator.sendMessage).toHaveBeenCalledWith(
      ctx,
      "a-1",
      "hello",
      null,
    );
  });

  it("clearAgentLog forwards agentId + taskId to the service", async () => {
    const ctx = buildTestContext();
    ctx.services.agentLogs.clearAgentLog = vi.fn().mockResolvedValue(true);

    const result = await invokeResolver(
      agentLogResolvers.Mutation.clearAgentLog,
      { args: { agentId: "a-1", taskId: "t-1" }, ctx },
    );

    expect(result).toBe(true);
    expect(ctx.services.agentLogs.clearAgentLog).toHaveBeenCalledWith(
      ctx,
      "a-1",
      "t-1",
    );
  });

  it("AgentLog.agent resolves parent.agentId via the agentLoader", async () => {
    const agent = { id: "a-1", name: "Carol" };
    const ctx = buildTestContext();
    ctx.loaders.agentLoader.load = vi.fn().mockResolvedValue(agent);

    const result = await invokeResolver(agentLogResolvers.AgentLog.agent, {
      // partial parent — resolver only reads agentId
      parent: { agentId: "a-1" } as any,
      ctx,
    });

    expect(result).toBe(agent);
  });
});
