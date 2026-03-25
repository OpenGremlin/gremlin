import { describe, expect, it, vi } from "vitest";

let mockOnline = true;
let connectivityCallback: ((isConnected: boolean) => void) | null = null;
const unsubscribe = vi.fn();

vi.mock("../lib/networkState", () => ({
  isOnline: () => mockOnline,
  onConnectivityChange: (cb: (isConnected: boolean) => void) => {
    connectivityCallback = cb;
    return unsubscribe;
  },
}));

let hookState: { isConnected: boolean } = { isConnected: true };
let effectCleanup: (() => void) | undefined;

vi.mock("react", () => ({
  useState: (initial: boolean | (() => boolean)) => {
    const val = typeof initial === "function" ? initial() : initial;
    hookState = { isConnected: val };
    return [
      hookState.isConnected,
      (v: boolean) => {
        hookState.isConnected = v;
      },
    ];
  },
  useEffect: (fn: () => (() => void) | undefined) => {
    const cleanup = fn();
    if (typeof cleanup === "function") effectCleanup = cleanup;
  },
}));

import { useNetworkStatus } from "./useNetworkStatus";

describe("useNetworkStatus", () => {
  it("defaults to current online state", () => {
    mockOnline = true;
    const result = useNetworkStatus();
    expect(result.isConnected).toBe(true);
  });

  it("initializes as offline when isOnline returns false", () => {
    mockOnline = false;
    const result = useNetworkStatus();
    expect(result.isConnected).toBe(false);
  });

  it("subscribes to connectivity changes on mount", () => {
    useNetworkStatus();
    expect(connectivityCallback).toBeTypeOf("function");
  });

  it("updates when connectivity changes", () => {
    mockOnline = true;
    useNetworkStatus();
    connectivityCallback?.(false);
    expect(hookState.isConnected).toBe(false);
    connectivityCallback?.(true);
    expect(hookState.isConnected).toBe(true);
  });

  it("returns unsubscribe as cleanup", () => {
    useNetworkStatus();
    expect(effectCleanup).toBe(unsubscribe);
  });
});
