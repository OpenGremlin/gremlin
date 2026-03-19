import { describe, expect, it, vi } from "vitest";
import { ReconnectTracker } from "./reconnectTracker";

describe("ReconnectTracker", () => {
  it("does not fire listeners on first connect", () => {
    const tracker = new ReconnectTracker();
    const cb = vi.fn();
    tracker.addListener(cb);

    tracker.handleConnected();

    expect(cb).not.toHaveBeenCalled();
  });

  it("fires listeners on second connect (reconnect)", () => {
    const tracker = new ReconnectTracker();
    const cb = vi.fn();
    tracker.addListener(cb);

    tracker.handleConnected();
    tracker.handleConnected();

    expect(cb).toHaveBeenCalledOnce();
  });

  it("fires all registered listeners on reconnect", () => {
    const tracker = new ReconnectTracker();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    tracker.addListener(cb1);
    tracker.addListener(cb2);

    tracker.handleConnected();
    tracker.handleConnected();

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not fire removed listeners", () => {
    const tracker = new ReconnectTracker();
    const cb = vi.fn();
    tracker.addListener(cb);
    tracker.removeListener(cb);

    tracker.handleConnected();
    tracker.handleConnected();

    expect(cb).not.toHaveBeenCalled();
  });

  it("fires on every subsequent reconnect", () => {
    const tracker = new ReconnectTracker();
    const cb = vi.fn();
    tracker.addListener(cb);

    tracker.handleConnected();
    tracker.handleConnected();
    tracker.handleConnected();
    tracker.handleConnected();

    expect(cb).toHaveBeenCalledTimes(3);
  });
});
