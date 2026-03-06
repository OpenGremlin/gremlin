import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { deleteJob } from "./deleteJob.js";

describe("deleteJob", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;

  const job = {
    id: "job-1",
    name: "Daily Report",
    description: "Generate report",
    recurrence: "every day at 9am",
    cronExpression: "0 9 * * *",
    timezone: "UTC",
    agentId: "clawd",
    status: "IDLE" as const,
    lastRun: null,
  };

  beforeEach(() => {
    ctx = createMockContext();

    mockSend = vi.fn().mockResolvedValue({});
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      key: mockKey,
    } as any);

    ctx.services.inbox.deleteCronSchedule.mockResolvedValue(undefined as any);
  });

  it("throws when job not found", async () => {
    ctx.services.jobs.getJob.mockResolvedValue(null);

    await expect(deleteJob(ctx, "job-1")).rejects.toThrow("Job job-1 not found");
  });

  it("deletes the job and returns it", async () => {
    ctx.services.jobs.getJob.mockResolvedValue(job as any);

    const result = await deleteJob(ctx, "job-1");

    expect(result).toEqual(job);
  });

  it("calls deleteCronSchedule", async () => {
    ctx.services.jobs.getJob.mockResolvedValue(job as any);

    await deleteJob(ctx, "job-1");

    expect(ctx.services.inbox.deleteCronSchedule).toHaveBeenCalledWith("job-1");
  });

  it("does not throw when deleteCronSchedule fails", async () => {
    ctx.services.jobs.getJob.mockResolvedValue(job as any);
    ctx.services.inbox.deleteCronSchedule.mockRejectedValue(new Error("schedule error"));

    const result = await deleteJob(ctx, "job-1");

    expect(result).toEqual(job);
  });
});
