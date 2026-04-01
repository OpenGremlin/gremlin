import { describe, expect, it, vi } from "vitest";

const mockWsClient = { subscribe: vi.fn() };

vi.mock("./apolloClient", () => ({
  getWsClient: () => mockWsClient,
  reconnectTracker: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe("wsClient", () => {
  it("getWsClient returns the Apollo WS client", async () => {
    const { getWsClient } = await import("./wsClient");
    expect(getWsClient()).toBe(mockWsClient);
  });

  it("initWsClient returns the same client as getWsClient", async () => {
    const { initWsClient, getWsClient } = await import("./wsClient");
    expect(initWsClient()).toBe(getWsClient());
  });

  it("tryGetWsClient returns the client", async () => {
    const { tryGetWsClient } = await import("./wsClient");
    expect(tryGetWsClient()).toBe(mockWsClient);
  });
});
