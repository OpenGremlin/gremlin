import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetStaleUnreadAgentIds = vi.fn();
const mockRingSqsDoorbells = vi.fn();

vi.mock("@gremlin/lib/services/inbox/getStaleUnreadAgentIds.js", () => ({
  getStaleUnreadAgentIds: (...args: unknown[]) =>
    mockGetStaleUnreadAgentIds(...args),
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

const { handler } = await import("./sweeper.js");

beforeEach(() => {
  mockGetStaleUnreadAgentIds.mockReset();
  mockRingSqsDoorbells.mockReset().mockResolvedValue(undefined);
});

describe("sweeper", () => {
  it("returns early when no stale items", async () => {
    mockGetStaleUnreadAgentIds.mockResolvedValueOnce([]);

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, stale: 0 });
    expect(mockRingSqsDoorbells).not.toHaveBeenCalled();
  });

  it("re-rings doorbells for agents with stale items", async () => {
    mockGetStaleUnreadAgentIds.mockResolvedValueOnce(["agent-1", "agent-2"]);

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, agents: 2 });
    expect(mockRingSqsDoorbells).toHaveBeenCalledTimes(1);
    const [, agentIds] = mockRingSqsDoorbells.mock.calls[0];
    expect(agentIds).toEqual(["agent-1", "agent-2"]);
  });

  it("passes context to service functions", async () => {
    mockGetStaleUnreadAgentIds.mockResolvedValueOnce(["agent-1"]);

    await handler();

    // Both functions receive the context as first arg
    const staleCtx = mockGetStaleUnreadAgentIds.mock.calls[0][0];
    const doorbellCtx = mockRingSqsDoorbells.mock.calls[0][0];
    expect(staleCtx).toBe(doorbellCtx);
    expect(staleCtx.resources.ddb).toBeDefined();
  });
});
