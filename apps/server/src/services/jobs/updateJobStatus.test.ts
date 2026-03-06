import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { JobStatus } from "../../gql/resolverTypes.js";
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
    status: JobStatus.Idle,
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
    const result = await updateJobStatus(ctx, "job-1", JobStatus.Idle);

    expect(result).toEqual(job);
  });

  it("updates with the correct item", async () => {
    await updateJobStatus(ctx, "job-1", JobStatus.Paused);

    expect(mockItem).toHaveBeenCalledWith({ id: "job-1", status: "PAUSED" }); // string value matches enum
  });

  it("throws when not found", async () => {
    mockSend.mockResolvedValue({ Attributes: undefined });

    await expect(updateJobStatus(ctx, "job-1", JobStatus.Idle)).rejects.toThrow(
      "Job job-1 not found",
    );
  });

  it("deletes cron schedule when status is PAUSED", async () => {
    const pausedJob = { ...job, status: JobStatus.Paused };
    mockSend.mockResolvedValue({ Attributes: pausedJob });

    await updateJobStatus(ctx, "job-1", JobStatus.Paused);

    expect(ctx.services.inbox.deleteCronSchedule).toHaveBeenCalledWith("job-1");
    expect(ctx.services.inbox.createCronSchedule).not.toHaveBeenCalled();
  });

  it("creates cron schedule when status is not PAUSED and cronExpression exists", async () => {
    mockSend.mockResolvedValue({ Attributes: { ...job, status: "IDLE" } });

    await updateJobStatus(ctx, "job-1", JobStatus.Idle);

    expect(ctx.services.inbox.createCronSchedule).toHaveBeenCalled();
    expect(ctx.services.inbox.deleteCronSchedule).not.toHaveBeenCalled();
  });

  it("does not create schedule when cronExpression is missing", async () => {
    const noCronJob = { ...job, cronExpression: null, status: JobStatus.Idle };
    mockSend.mockResolvedValue({ Attributes: noCronJob });

    await updateJobStatus(ctx, "job-1", JobStatus.Idle);

    expect(ctx.services.inbox.createCronSchedule).not.toHaveBeenCalled();
    expect(ctx.services.inbox.deleteCronSchedule).not.toHaveBeenCalled();
  });
});
