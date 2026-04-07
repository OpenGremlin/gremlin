import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getTasksByAgent } from "./getTasksByAgent.js";

describe("getTasksByAgent", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns array of tasks for the agent", async () => {
    const tasks = [
      {
        id: "task-1",
        agentId: "agent-1",
        title: "Task One",
        message: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        completedAt: null,
        originJobId: null,
        emoji: null,
        attachments: [],
      },
      {
        id: "task-2",
        agentId: "agent-1",
        title: "Task Two",
        message: "done",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        completedAt: null,
        originJobId: null,
        emoji: null,
        attachments: [],
      },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: tasks }),
        }),
      }),
    } as any);

    const result = await getTasksByAgent(ctx, "agent-1");

    expect(result).toEqual(tasks);
  });

  it("returns empty array when Items is undefined", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getTasksByAgent(ctx, "agent-1");

    expect(result).toEqual([]);
  });
});
