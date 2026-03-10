import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getJob } from "./getJob.js";

describe("getJob", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns item when found", async () => {
    const job = {
      id: "job-1",
      name: "Daily Report",
      description: "Generate report",
      recurrence: "every day at 9am",
      cronExpression: "0 9 * * *",
      timezone: "UTC",
      agentId: "clawd",
      lastRun: null,
    };

    const mockSend = vi.fn().mockResolvedValue({ Item: job });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getJob(ctx, "job-1");

    expect(result).toEqual(job);
    expect(mockKey).toHaveBeenCalledWith({ id: "job-1" });
  });

  it("returns null when not found", async () => {
    const mockSend = vi.fn().mockResolvedValue({ Item: undefined });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.AgentJob.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getJob(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
