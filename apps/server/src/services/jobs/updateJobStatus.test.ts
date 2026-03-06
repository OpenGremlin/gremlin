import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { updateJobStatus } from "./updateJobStatus.js";

describe("updateJobStatus", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockItem: ReturnType<typeof vi.fn>;

  const job = {
    id: "job-1",
    name: "Daily Report",
    description: "desc",
    recurrence: "every day at 9am",
    cronExpression: "0 9 * * *",
    timezone: "UTC",
    agentId: "clawd",
    status: "IDLE" as const,
    lastRun: null,
  };

  beforeEach(() => {
    ctx = createMockContext();

    mockSend = vi.fn().mockResolvedValue({ Attributes: job });
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    mockItem = vi.fn().mockReturnValue({ options: mockOptions });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      item: mockItem,
    } as any);

    ctx.services.inbox.deleteCronSchedule.mockResolvedValue(undefined as any);
    ctx.services.inbox.createCronSchedule.mockResolvedValue(undefined as any);
  });

  it("returns updated attributes", async () => {
    const result = await updateJobStatus(ctx, "job-1", "IDLE");

    expect(result).toEqual(job);
  });

  it("updates with the correct item", async () => {
    await updateJobStatus(ctx, "job-1", "PAUSED");

    expect(mockItem).toHaveBeenCalledWith({ id: "job-1", status: "PAUSED" });
  });

  it("throws when not found", async () => {
    mockSend.mockResolvedValue({ Attributes: undefined });

    await expect(updateJobStatus(ctx, "job-1", "IDLE")).rejects.toThrow(
      "Job job-1 not found",
    );
  });

  it("deletes cron schedule when status is PAUSED", async () => {
    const pausedJob = { ...job, status: "PAUSED" as const };
    mockSend.mockResolvedValue({ Attributes: pausedJob });

    await updateJobStatus(ctx, "job-1", "PAUSED");

    expect(ctx.services.inbox.deleteCronSchedule).toHaveBeenCalledWith("job-1");
    expect(ctx.services.inbox.createCronSchedule).not.toHaveBeenCalled();
  });

  it("creates cron schedule when status is not PAUSED and cronExpression exists", async () => {
    mockSend.mockResolvedValue({ Attributes: { ...job, status: "IDLE" } });

    await updateJobStatus(ctx, "job-1", "IDLE");

    expect(ctx.services.inbox.createCronSchedule).toHaveBeenCalled();
    expect(ctx.services.inbox.deleteCronSchedule).not.toHaveBeenCalled();
  });

  it("does not create schedule when cronExpression is missing", async () => {
    const noCronJob = { ...job, cronExpression: null, status: "IDLE" as const };
    mockSend.mockResolvedValue({ Attributes: noCronJob });

    await updateJobStatus(ctx, "job-1", "IDLE");

    expect(ctx.services.inbox.createCronSchedule).not.toHaveBeenCalled();
    expect(ctx.services.inbox.deleteCronSchedule).not.toHaveBeenCalled();
  });
});
