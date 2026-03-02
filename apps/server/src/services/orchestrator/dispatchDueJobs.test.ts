import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchDueJobs } from "./dispatchDueJobs.js";
import * as computeModule from "../jobs/computeLastDueTrigger.js";
import * as runTaskLaneModule from "./runTaskLane.js";
import type { ServiceContext } from "../context.js";

vi.mock("../jobs/computeLastDueTrigger.js", () => ({
  computeLastDueTrigger: vi.fn(),
}));

vi.mock("./runTaskLane.js", () => ({
  runTaskLane: vi.fn(() => Promise.resolve("")),
}));

const mockComputeLastDueTrigger = vi.mocked(computeModule.computeLastDueTrigger);
const mockRunTaskLane = vi.mocked(runTaskLaneModule.runTaskLane);

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    name: "Test Job",
    description: "Do something",
    recurrence: "daily",
    cronExpression: "0 9 * * *",
    agentId: "clawd",
    status: "ACTIVE",
    lastRun: null,
    nextRun: null,
    ...overrides,
  };
}

function makeCtx(jobs: ReturnType<typeof makeJob>[]): ServiceContext {
  const sendMock = vi.fn(() => Promise.resolve({}));
  return {
    resources: {
      ddb: {
        table: {
          getName: () => "gremlin",
          getDocumentClient: () => ({ send: sendMock }),
        },
        entities: {},
      },
      pubsub: {} as never,
    },
    services: {
      jobs: { getJobs: vi.fn(() => Promise.resolve(jobs)) },
      profile: { getProfile: vi.fn(() => Promise.resolve(null)) },
    },
    mediaCdnUrl: "",
  } as unknown as ServiceContext;
}

describe("dispatchDueJobs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunTaskLane.mockResolvedValue("");
  });

  it("creates trigger + task and dispatches for a due job", async () => {
    const job = makeJob();
    const ctx = makeCtx([job]);
    const triggerTime = Date.now() - 60_000;
    mockComputeLastDueTrigger.mockReturnValue(triggerTime);

    await dispatchDueJobs(ctx);

    const sendMock = ctx.resources.ddb.table.getDocumentClient().send as ReturnType<typeof vi.fn>;
    expect(sendMock).toHaveBeenCalledOnce();

    const command = sendMock.mock.calls[0][0];
    const items = command.input.TransactItems;
    expect(items).toHaveLength(2);
    expect(items[0].Put.Item._et).toBe("CronJobTrigger");
    expect(items[0].Put.Item.jobId).toBe("job-1");
    expect(items[0].Put.ConditionExpression).toBe("attribute_not_exists(pk)");
    expect(items[1].Put.Item._et).toBe("Task");
    expect(items[1].Put.Item.originJobId).toBe("job-1");

    expect(mockRunTaskLane).toHaveBeenCalledOnce();
    expect(mockRunTaskLane.mock.calls[0][1]).toBe(items[1].Put.Item.id);
    expect(mockRunTaskLane.mock.calls[0][2]).toBe("Do something");
  });

  it("skips when trigger already exists (TransactionCanceledException)", async () => {
    const job = makeJob();
    const ctx = makeCtx([job]);
    mockComputeLastDueTrigger.mockReturnValue(Date.now() - 60_000);

    const err = new Error("ConditionalCheckFailed");
    err.name = "TransactionCanceledException";
    const sendMock = ctx.resources.ddb.table.getDocumentClient().send as ReturnType<typeof vi.fn>;
    sendMock.mockRejectedValue(err);

    await dispatchDueJobs(ctx);

    expect(mockRunTaskLane).not.toHaveBeenCalled();
  });

  it("skips PAUSED jobs", async () => {
    const job = makeJob({ status: "PAUSED" });
    const ctx = makeCtx([job]);

    await dispatchDueJobs(ctx);

    expect(mockComputeLastDueTrigger).not.toHaveBeenCalled();
    expect(mockRunTaskLane).not.toHaveBeenCalled();
  });

  it("skips jobs without cronExpression", async () => {
    const job = makeJob({ cronExpression: null });
    const ctx = makeCtx([job]);

    await dispatchDueJobs(ctx);

    expect(mockComputeLastDueTrigger).not.toHaveBeenCalled();
    expect(mockRunTaskLane).not.toHaveBeenCalled();
  });

  it("skips jobs where cron is outside catch-up window", async () => {
    const job = makeJob();
    const ctx = makeCtx([job]);
    mockComputeLastDueTrigger.mockReturnValue(null);

    await dispatchDueJobs(ctx);

    const sendMock = ctx.resources.ddb.table.getDocumentClient().send as ReturnType<typeof vi.fn>;
    expect(sendMock).not.toHaveBeenCalled();
    expect(mockRunTaskLane).not.toHaveBeenCalled();
  });
});
