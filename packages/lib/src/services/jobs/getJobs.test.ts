import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getJobs } from "./getJobs.js";

describe("getJobs", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns array of jobs", async () => {
    const jobs = [
      {
        id: "job-1",
        name: "Daily Report",
        description: "desc",
        recurrence: "every day",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        agentId: "clawd",
        lastRun: null,
      },
      {
        id: "job-2",
        name: "Weekly Sync",
        description: "desc",
        recurrence: "every week",
        cronExpression: "0 0 * * 1",
        timezone: "UTC",
        agentId: "clawd",
        lastRun: null,
      },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: jobs }),
        }),
      }),
    } as any);

    const result = await getJobs(ctx);

    expect(result).toEqual(jobs);
  });

  it("returns empty array when Items is undefined", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getJobs(ctx);

    expect(result).toEqual([]);
  });
});
