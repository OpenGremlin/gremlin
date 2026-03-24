import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("graphql-ws", () => ({
  createClient: vi.fn(() => ({ subscribe: vi.fn() })),
}));
vi.mock("./auth", () => ({ getTokenSync: () => "tok" }));
vi.mock("./config", () => ({ getApiUrl: () => "https://api.example.com" }));
vi.mock("./logger", () => ({
  clientLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("./reconnectTracker", () => ({
  ReconnectTracker: class {
    handleConnected = vi.fn();
  },
}));

describe("wsClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("getWsClient throws before initWsClient is called", async () => {
    const { getWsClient } = await import("./wsClient");
    expect(() => getWsClient()).toThrow("wsClient not initialized");
  });

  it("initWsClient creates the client and getWsClient returns it", async () => {
    const { initWsClient, getWsClient } = await import("./wsClient");
    const client = initWsClient();
    expect(client).toBeDefined();
    expect(getWsClient()).toBe(client);
  });

  it("initWsClient is idempotent", async () => {
    const { createClient } = await import("graphql-ws");
    const { initWsClient } = await import("./wsClient");
    const first = initWsClient();
    const second = initWsClient();
    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
