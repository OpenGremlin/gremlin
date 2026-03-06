import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { updateJob } from "./updateJob.js";

vi.mock("./recurrenceToCron.js", () => ({
  recurrenceToCron: vi.fn().mockResolvedValue("0 9 * * *"),
}));

describe("updateJob", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockItem: ReturnType<typeof vi.fn>;

  const updatedJob = {
    id: "job-1",
    name: "Updated Name",
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

    mockSend = vi.fn().mockResolvedValue({ Attributes: updatedJob });
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    mockItem = vi.fn().mockReturnValue({ options: mockOptions });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      item: mockItem,
    } as any);

    ctx.services.inbox.deleteCronSchedule.mockResolvedValue(undefined as any);
    ctx.services.inbox.createCronSchedule.mockResolvedValue(undefined as any);
  });

  it("returns updated attributes", async () => {
    const result = await updateJob(ctx, "job-1", { name: "Updated Name" });

    expect(result).toEqual(updatedJob);
  });

  it("only includes non-null fields in update", async () => {
    await updateJob(ctx, "job-1", {
      name: "Updated Name",
      description: null,
      agentId: null,
    });

    expect(mockItem).toHaveBeenCalledWith({ id: "job-1", name: "Updated Name" });
  });

  it("throws when Attributes is undefined", async () => {
    mockSend.mockResolvedValue({ Attributes: undefined });

    await expect(updateJob(ctx, "job-1", { name: "X" })).rejects.toThrow(
      "Job job-1 not found",
    );
  });

  it("looks up existing job for timezone when recurrence changes", async () => {
    const existingJob = { ...updatedJob, timezone: "America/New_York" };
    ctx.services.jobs.getJob.mockResolvedValue(existingJob as any);

    await updateJob(ctx, "job-1", { recurrence: "every week" });

    expect(ctx.services.jobs.getJob).toHaveBeenCalledWith(ctx, "job-1");
  });

  it("uses provided timezone over existing job timezone", async () => {
    await updateJob(ctx, "job-1", {
      recurrence: "every week",
      timezone: "Europe/London",
    });

    expect(ctx.services.jobs.getJob).not.toHaveBeenCalled();
  });

  it("recreates EventBridge schedule when recurrence changes", async () => {
    ctx.services.jobs.getJob.mockResolvedValue(updatedJob as any);

    await updateJob(ctx, "job-1", { recurrence: "every week" });

    expect(ctx.services.inbox.deleteCronSchedule).toHaveBeenCalledWith("job-1");
  });

  it("recreates EventBridge schedule when timezone changes", async () => {
    await updateJob(ctx, "job-1", { timezone: "America/New_York" });

    expect(ctx.services.inbox.deleteCronSchedule).toHaveBeenCalledWith("job-1");
  });
});
