import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../wsClient", () => ({
  wsClient: { subscribe: vi.fn() },
}));

import { wsClient } from "../wsClient";
import { SubscriptionManager } from "./SubscriptionManager";

const mockSubscribe = vi.mocked(wsClient.subscribe);

beforeEach(() => {
  vi.useFakeTimers();
  mockSubscribe.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function setupManager() {
  const unsubWs = vi.fn();
  let wsHandler: { next: (value: { data: any }) => void };
  mockSubscribe.mockImplementation((_payload: any, handler: any) => {
    wsHandler = handler;
    return unsubWs;
  });

  const manager = new SubscriptionManager(
    "subscription Test($id: ID!) { test(id: $id) { id } }",
    "id",
  );

  return {
    manager,
    unsubWs,
    pushData: (data: any) => wsHandler.next({ data: { test: data } }),
  };
}

describe("SubscriptionManager", () => {
  it("opens a WebSocket subscription on first subscribe", () => {
    const { manager } = setupManager();
    const cb = vi.fn();
    manager.subscribe("entity-1", cb);

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: "entity-1" } }),
      expect.any(Object),
    );
  });

  it("delivers data to all callbacks", () => {
    const { manager, pushData } = setupManager();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    manager.subscribe("entity-1", cb1);
    manager.subscribe("entity-1", cb2);

    pushData({ id: "entity-1", name: "updated" });

    expect(cb1).toHaveBeenCalledWith({ id: "entity-1", name: "updated" });
    expect(cb2).toHaveBeenCalledWith({ id: "entity-1", name: "updated" });
  });

  it("reuses WebSocket for second subscriber to same id", () => {
    const { manager } = setupManager();
    manager.subscribe("entity-1", vi.fn());
    manager.subscribe("entity-1", vi.fn());

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it("tears down after linger timer when all unsubscribe", () => {
    const { manager, unsubWs } = setupManager();
    const unsub1 = manager.subscribe("entity-1", vi.fn());
    const unsub2 = manager.subscribe("entity-1", vi.fn());

    unsub1();
    expect(unsubWs).not.toHaveBeenCalled();

    unsub2();
    expect(unsubWs).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(unsubWs).toHaveBeenCalledTimes(1);
  });

  it("cancels linger when re-subscribed during linger period", () => {
    const { manager, unsubWs } = setupManager();
    const unsub = manager.subscribe("entity-1", vi.fn());
    unsub();

    vi.advanceTimersByTime(500);
    manager.subscribe("entity-1", vi.fn());

    vi.advanceTimersByTime(1000);
    expect(unsubWs).not.toHaveBeenCalled();
  });

  it("opens separate subscriptions for different ids", () => {
    const { manager } = setupManager();
    manager.subscribe("entity-1", vi.fn());
    manager.subscribe("entity-2", vi.fn());

    expect(mockSubscribe).toHaveBeenCalledTimes(2);
  });
});
