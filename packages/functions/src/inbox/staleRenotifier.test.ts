import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetStaleUnreadTargets = vi.fn();
const mockRingSqsDoorbells = vi.fn();

vi.mock("@gremlin/lib/services/inbox/getStaleUnreadAgentIds.js", () => ({
  getStaleUnreadTargets: (...args: unknown[]) =>
    mockGetStaleUnreadTargets(...args),
}));

vi.mock("@gremlin/lib/services/inbox/ringSqsDoorbells.js", () => ({
  ringSqsDoorbells: (...args: unknown[]) => mockRingSqsDoorbells(...args),
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

const { handler } = await import("./staleRenotifier.js");

beforeEach(() => {
  mockGetStaleUnreadTargets.mockReset();
  mockRingSqsDoorbells.mockReset().mockResolvedValue(undefined);
});

describe("staleRenotifier", () => {
  it("returns early when no stale items", async () => {
    mockGetStaleUnreadTargets.mockResolvedValueOnce([]);

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, stale: 0 });
    expect(mockRingSqsDoorbells).not.toHaveBeenCalled();
  });

  it("re-rings doorbells for agents with stale items", async () => {
    const targets = [
      { agentId: "agent-1", lane: "main" },
      { agentId: "agent-2", lane: "task:task-1" },
    ];
    mockGetStaleUnreadTargets.mockResolvedValueOnce(targets);

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, targets: 2 });
    expect(mockRingSqsDoorbells).toHaveBeenCalledTimes(1);
    const [, passedTargets] = mockRingSqsDoorbells.mock.calls[0];
    expect(passedTargets).toEqual(targets);
  });

  it("passes context to service functions", async () => {
    mockGetStaleUnreadTargets.mockResolvedValueOnce([
      { agentId: "agent-1", lane: "main" },
    ]);

    await handler();

    const staleCtx = mockGetStaleUnreadTargets.mock.calls[0][0];
    const doorbellCtx = mockRingSqsDoorbells.mock.calls[0][0];
    expect(staleCtx).toBe(doorbellCtx);
    expect(staleCtx.resources.ddb).toBeDefined();
  });
});
