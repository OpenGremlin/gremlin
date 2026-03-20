import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnqueueWork = vi.fn();
const mockGetAgents = vi.fn();

vi.mock("@gremlin/lib/services/inbox/enqueueWork.js", () => ({
  enqueueWork: (...args: unknown[]) => mockEnqueueWork(...args),
}));

vi.mock("@gremlin/lib/services/agents/getAgents.js", () => ({
  getAgents: (...args: unknown[]) => mockGetAgents(...args),
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

const { handler } = await import("./scheduledWriter.js");

beforeEach(() => {
  mockEnqueueWork.mockReset();
  mockGetAgents.mockReset();
});

describe("scheduledWriter", () => {
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
    const [, agentId, lane, input] = mockEnqueueWork.mock.calls[0];
    expect(agentId).toBe("agent-1");
    expect(lane).toBe("system");
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
      payload: { taskId: "task-1", prompt: "follow up" },
    });

    expect(result.statusCode).toBe(200);
    const [, , lane, input] = mockEnqueueWork.mock.calls[0];
    expect(lane).toBe("task:task-1");
    expect(input.type).toBe("agent_self_followup");
  });

  it("fans out core_memory_review to all active agents", async () => {
    mockGetAgents.mockResolvedValueOnce([
      { id: "agent-1", retired: false },
      { id: "agent-2", retired: true },
      { id: "agent-3", retired: false },
    ]);
    mockEnqueueWork.mockResolvedValue({
      id: "inbox-3",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await handler({
      type: "core_memory_review",
      payload: {},
    });

    expect(result.statusCode).toBe(200);
    expect(result.ids).toHaveLength(2);
    expect(mockEnqueueWork).toHaveBeenCalledTimes(2);

    const agentIds = mockEnqueueWork.mock.calls.map(
      ([, agentId]: unknown[]) => agentId,
    );
    expect(agentIds).toContain("agent-1");
    expect(agentIds).toContain("agent-3");
    expect(agentIds).not.toContain("agent-2");

    // All should be on the system lane
    for (const call of mockEnqueueWork.mock.calls) {
      expect(call[2]).toBe("system");
    }
  });

  it("throws when agentId is missing for non-fanout event types", async () => {
    await expect(
      handler({ type: "scheduled_job", payload: {} }),
    ).rejects.toThrow('agentId is required for event type "scheduled_job"');
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
