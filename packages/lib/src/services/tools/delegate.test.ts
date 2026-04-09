import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import type { TeamMember } from "../orchestrator/agentLaneContext.js";
import { delegateTool } from "./delegate.js";

const TOOL_OPTS = {
  toolCallId: "tc-1",
  messages: [],
  abortSignal: new AbortController().signal,
};

const team: TeamMember[] = [
  { id: "researcher", name: "Researcher", delegationHint: "Web research" },
  { id: "writer", name: "Writer", delegationHint: "Drafts briefs" },
];

const createdTask = {
  id: "task-99",
  agentId: "researcher",
  title: "Find Q4 pricing",
  message: null,
  createdAt: "2026-01-15T12:00:00.000Z",
  updatedAt: "2026-01-15T12:00:00.000Z",
  completedAt: null,
  originJobId: null,
  emoji: null,
  attachments: [],
  assignerAgentId: "manager",
  brief: "Find Q4 pricing changes from competitors X, Y, Z.",
};

describe("delegateTool", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    ctx.services.tasks.createTask.mockResolvedValue(createdTask as any);
  });

  it("rejects targets not in the team with a structured error", async () => {
    const tool = delegateTool(ctx, "manager", team);

    const result = await tool.execute(
      {
        targetAgentId: "stranger",
        title: "Do a thing",
        brief: "...",
      },
      TOOL_OPTS,
    );

    expect(result).toMatchObject({
      error: expect.stringContaining("Cannot delegate to stranger"),
    });
    expect(ctx.services.tasks.createTask).not.toHaveBeenCalled();
    expect(ctx.services.inbox.enqueueWork).not.toHaveBeenCalled();
  });

  it("creates a task on the target agent with assignerAgentId set", async () => {
    const tool = delegateTool(ctx, "manager", team);

    await tool.execute(
      {
        targetAgentId: "researcher",
        title: "Find Q4 pricing",
        brief: "Find Q4 pricing changes from competitors X, Y, Z.",
        successCriteria: "All three competitors covered.",
      },
      TOOL_OPTS,
    );

    expect(ctx.services.tasks.createTask).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        agentId: "researcher",
        title: "Find Q4 pricing",
        assignerAgentId: "manager",
        brief: "Find Q4 pricing changes from competitors X, Y, Z.",
        successCriteria: "All three competitors covered.",
      }),
    );
  });

  it("enqueues run_task on the target's task lane", async () => {
    const tool = delegateTool(ctx, "manager", team);

    await tool.execute(
      {
        targetAgentId: "researcher",
        title: "Find Q4 pricing",
        brief: "the brief",
      },
      TOOL_OPTS,
    );

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "researcher",
      "task:task-99",
      expect.objectContaining({
        type: "run_task",
        payload: expect.objectContaining({
          taskId: "task-99",
          prompt: "the brief",
        }),
      }),
    );
  });

  it("forwards attachments through to the run_task payload", async () => {
    const tool = delegateTool(ctx, "manager", team);

    await tool.execute(
      {
        targetAgentId: "researcher",
        title: "x",
        brief: "y",
        attachments: [{ type: "file", path: "spec.md" }],
      },
      TOOL_OPTS,
    );

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "researcher",
      "task:task-99",
      expect.objectContaining({
        payload: expect.objectContaining({
          attachments: [{ type: "file", path: "spec.md" }],
        }),
      }),
    );
  });

  it("returns target name from the team roster", async () => {
    const tool = delegateTool(ctx, "manager", team);

    const result = await tool.execute(
      {
        targetAgentId: "researcher",
        title: "x",
        brief: "y",
      },
      TOOL_OPTS,
    );

    expect(result).toMatchObject({
      taskId: "task-99",
      targetAgentId: "researcher",
      targetName: "Researcher",
      title: "x",
      status: "accepted",
    });
  });

  it("kicks off async emoji selection", async () => {
    const tool = delegateTool(ctx, "manager", team);

    await tool.execute(
      {
        targetAgentId: "researcher",
        title: "x",
        brief: "y",
      },
      TOOL_OPTS,
    );

    expect(ctx.services.tasks.selectAndSetTaskEmoji).toHaveBeenCalled();
  });
});
