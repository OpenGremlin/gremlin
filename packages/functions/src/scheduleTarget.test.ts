import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnqueueWork = vi.fn();

vi.mock("@gremlin/lib/services/inbox/enqueueWork.js", () => ({
  enqueueWork: (...args: unknown[]) => mockEnqueueWork(...args),
}));

vi.mock("@gremlin/lib/resources/ddb/index.js", () => ({
  ddb: { table: {} },
}));

vi.mock("@gremlin/lib/logger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const { handler } = await import("./scheduleTarget.js");

beforeEach(() => {
  mockEnqueueWork.mockReset();
});

describe("scheduleTarget", () => {
  it("enqueues an inbox item via inboxService", async () => {
    mockEnqueueWork.mockResolvedValueOnce({
      id: "inbox-1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: { jobId: "job-1" },
    });

    expect(result.statusCode).toBe(200);
    expect(result.id).toBe("inbox-1");

    expect(mockEnqueueWork).toHaveBeenCalledTimes(1);
    const [, agentId, input] = mockEnqueueWork.mock.calls[0];
    expect(agentId).toBe("agent-1");
    expect(input.type).toBe("scheduled_job");
    expect(input.payload).toEqual({ jobId: "job-1" });
  });

  it("handles agent_self_followup event type", async () => {
    mockEnqueueWork.mockResolvedValueOnce({
      id: "inbox-2",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await handler({
      type: "agent_self_followup",
      agentId: "agent-2",
      payload: {},
    });

    expect(result.statusCode).toBe(200);
    const [, , input] = mockEnqueueWork.mock.calls[0];
    expect(input.type).toBe("agent_self_followup");
  });

  it("handles core_memory_review event type", async () => {
    mockEnqueueWork.mockResolvedValueOnce({
      id: "inbox-3",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await handler({
      type: "core_memory_review",
      agentId: "clawd",
      payload: {},
    });

    expect(result.statusCode).toBe(200);
    const [, , input] = mockEnqueueWork.mock.calls[0];
    expect(input.type).toBe("core_memory_review");
  });

  it("returns the id from enqueueWork", async () => {
    mockEnqueueWork.mockResolvedValueOnce({ id: "id-a", createdAt: "" });
    const r1 = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: {},
    });

    mockEnqueueWork.mockResolvedValueOnce({ id: "id-b", createdAt: "" });
    const r2 = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: {},
    });

    expect(r1.id).not.toBe(r2.id);
  });
});
