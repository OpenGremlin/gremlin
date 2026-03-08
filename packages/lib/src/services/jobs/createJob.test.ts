import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { createJob } from "./createJob.js";

vi.mock("./recurrenceToCron.js", () => ({
  recurrenceToCron: vi.fn().mockResolvedValue("0 9 * * *"),
}));

describe("createJob", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-123" });

    mockSend = vi.fn().mockResolvedValue({});
    mockItem = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      item: mockItem,
    } as any);

    ctx.services.inbox.createCronSchedule.mockResolvedValue(undefined as any);
  });

  it("creates a job with the correct fields", async () => {
    const result = await createJob(ctx, {
      name: "Daily Report",
      description: "Generate report",
      recurrence: "every day at 9am",
      timezone: "America/New_York",
    });

    expect(result).toEqual({
      id: "test-uuid-123",
      name: "Daily Report",
      description: "Generate report",
      recurrence: "every day at 9am",
      cronExpression: "0 9 * * *",
      timezone: "America/New_York",
      agentId: "clawd",
      status: "IDLE",
      lastRun: null,
    });
  });

  it("defaults agentId to 'clawd' when null", async () => {
    const result = await createJob(ctx, {
      name: "Test",
      description: "desc",
      recurrence: "every day",
      timezone: "UTC",
      agentId: null,
    });

    expect(result.agentId).toBe("clawd");
  });

  it("uses provided agentId when given", async () => {
    const result = await createJob(ctx, {
      name: "Test",
      description: "desc",
      recurrence: "every day",
      timezone: "UTC",
      agentId: "custom-agent",
    });

    expect(result.agentId).toBe("custom-agent");
  });

  it("calls createCronSchedule when cronExpression exists", async () => {
    await createJob(ctx, {
      name: "Test",
      description: "desc",
      recurrence: "every day",
      timezone: "UTC",
    });

    expect(ctx.services.inbox.createCronSchedule).toHaveBeenCalled();
  });

  it("does not throw when createCronSchedule fails", async () => {
    ctx.services.inbox.createCronSchedule.mockRejectedValue(
      new Error("schedule error"),
    );

    const result = await createJob(ctx, {
      name: "Test",
      description: "desc",
      recurrence: "every day",
      timezone: "UTC",
    });

    expect(result.id).toBe("test-uuid-123");
  });
});
