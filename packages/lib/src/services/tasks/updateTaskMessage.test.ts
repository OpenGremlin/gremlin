import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { updateTaskMessage } from "./updateTaskMessage.js";

describe("updateTaskMessage", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  const existingTask = {
    id: "task-1",
    agentId: "agent-1",
    title: "Test Task",
    message: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",

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

    await expect(
      updateTaskMessage(ctx, "nonexistent", "hello"),
    ).rejects.toThrow("Task nonexistent not found");
  });

  it("updates the task message via entity update", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(existingTask as any);

    const mockSend = vi.fn().mockResolvedValue({});
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    const mockItem = vi.fn().mockReturnValue({ options: mockOptions });
    ctx.resources.ddb.entities.Task.build.mockReturnValue({
      item: mockItem,
    } as any);

    await updateTaskMessage(ctx, "task-1", "new message");

    expect(mockItem).toHaveBeenCalledWith({
      id: "task-1",
      agentId: "agent-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      message: "new message",
      updatedAt: "2026-01-15T12:00:00.000Z",
    });
    expect(mockOptions).toHaveBeenCalledWith({ returnValues: "NONE" });
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it("publishes task update to pubsub", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(existingTask as any);

    const mockSend = vi.fn().mockResolvedValue({});
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    const mockItem = vi.fn().mockReturnValue({ options: mockOptions });
    ctx.resources.ddb.entities.Task.build.mockReturnValue({
      item: mockItem,
    } as any);

    await updateTaskMessage(ctx, "task-1", "new message");

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "taskUpdated:task-1",
      {
        ...existingTask,
        message: "new message",
        updatedAt: "2026-01-15T12:00:00.000Z",
      },
    );
  });
});
