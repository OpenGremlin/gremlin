import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getTask } from "./getTask.js";

describe("getTask", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns item when found", async () => {
    const task = {
      id: "task-1",
      agentId: "agent-1",
      title: "Test Task",
      message: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      originJobId: null,
      emoji: null,
      attachments: [],
    };

    const mockSend = vi.fn().mockResolvedValue({ Item: task });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Task.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getTask(ctx, "task-1");

    expect(result).toEqual(task);
    expect(mockKey).toHaveBeenCalledWith({ id: "task-1" });
  });

  it("returns null when not found", async () => {
    const mockSend = vi.fn().mockResolvedValue({ Item: undefined });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Task.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getTask(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
