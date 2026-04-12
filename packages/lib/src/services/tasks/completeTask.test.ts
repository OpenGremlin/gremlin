import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { completeTask } from "./completeTask.js";

describe("completeTask", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  const openTask = {
    id: "task-1",
    agentId: "agent-1",
    title: "Test Task",
    message: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    originJobId: null,
    emoji: null,
  };

  beforeEach(() => {
    ctx = createMockContext();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  });

  it("throws when task not found", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(null);

    await expect(completeTask(ctx, "missing")).rejects.toThrow(
      "Task missing not found",
    );
  });

  it("sets completedAt and publishes pubsub update", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(openTask as any);

    const mockSend = vi.fn().mockResolvedValue({});
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    const mockItem = vi.fn().mockReturnValue({ options: mockOptions });
    ctx.resources.ddb.entities.Task.build.mockReturnValue({
      item: mockItem,
    } as any);

    await completeTask(ctx, "task-1");

    expect(mockItem).toHaveBeenCalledWith({
      id: "task-1",
      agentId: "agent-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      completedAt: "2026-01-15T12:00:00.000Z",
    });
    expect(mockSend).toHaveBeenCalledOnce();
    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "taskUpdated:task-1",
      expect.objectContaining({
        completedAt: "2026-01-15T12:00:00.000Z",
        updatedAt: "2026-01-15T12:00:00.000Z",
      }),
    );
  });

  it("is a no-op when task is already complete", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...openTask,
      completedAt: "2026-01-10T00:00:00.000Z",
    } as any);

    const buildSpy = ctx.resources.ddb.entities.Task.build;

    await completeTask(ctx, "task-1");

    expect(buildSpy).not.toHaveBeenCalled();
    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });
});
