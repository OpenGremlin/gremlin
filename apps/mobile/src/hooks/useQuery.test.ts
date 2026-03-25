import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsOnline = true;
let connectivityListeners: Array<(online: boolean) => void> = [];

vi.mock("../lib/networkState", () => ({
  isOnline: () => mockIsOnline,
  onConnectivityChange: (cb: (online: boolean) => void) => {
    connectivityListeners.push(cb);
    return () => {
      connectivityListeners = connectivityListeners.filter((l) => l !== cb);
    };
  },
}));

let mockGqlResult: unknown = { data: "ok" };
let mockGqlError: Error | null = null;

vi.mock("../lib/auth", () => ({
  gql: vi.fn(() =>
    mockGqlError
      ? Promise.reject(mockGqlError)
      : Promise.resolve(mockGqlResult),
  ),
}));

vi.mock("../lib/logger", () => ({
  clientLogger: { error: vi.fn() },
}));

// Track state changes from hooks
let stateUpdates: Record<string, unknown[]> = {};
let effectCleanups: Array<() => void> = [];
let effectCallbacks: Array<() => (() => void) | undefined> = [];

vi.mock("react", () => {
  const memoCache = new Map<string, unknown>();
  return {
    useState: (initial: unknown) => {
      const key = `state_${Object.keys(stateUpdates).length}`;
      if (!stateUpdates[key]) stateUpdates[key] = [initial];
      const current = stateUpdates[key].at(-1);
      return [
        current,
        (val: unknown) => {
          const resolved =
            typeof val === "function" ? val(stateUpdates[key].at(-1)) : val;
          stateUpdates[key].push(resolved);
        },
      ];
    },
    useEffect: (fn: () => (() => void) | undefined, _deps?: unknown[]) => {
      effectCallbacks.push(fn);
    },
    useMemo: (fn: () => unknown, deps: unknown[]) => {
      const key = JSON.stringify(deps);
      if (!memoCache.has(key)) memoCache.set(key, fn());
      return memoCache.get(key);
    },
  };
});

import type { TypedDocumentString } from "../graphql/generated/graphql";
import { useQuery } from "./useQuery";

const fakeQuery = "query { test }" as unknown as TypedDocumentString<
  { data: string },
  Record<string, never>
>;

function resetMocks() {
  stateUpdates = {};
  effectCallbacks = [];
  effectCleanups = [];
  connectivityListeners = [];
  mockIsOnline = true;
  mockGqlResult = { data: "ok" };
  mockGqlError = null;
}

function runEffects() {
  for (const fn of effectCallbacks) {
    const cleanup = fn();
    if (typeof cleanup === "function") effectCleanups.push(cleanup);
  }
  effectCallbacks = [];
}

describe("useQuery offline behavior", () => {
  beforeEach(resetMocks);

  it("sets error when offline and does not call gql", async () => {
    mockIsOnline = false;
    const { gql } = await import("../lib/auth");

    useQuery(fakeQuery);
    runEffects();

    // error state (index 3 = error useState)
    expect(stateUpdates.state_2?.at(-1)).toBe("No internet connection");
    // loading set to false
    expect(stateUpdates.state_1?.at(-1)).toBe(false);
    // gql should not have been called
    expect(gql).not.toHaveBeenCalled();
  });

  it("subscribes to connectivity changes when offline", () => {
    mockIsOnline = false;

    useQuery(fakeQuery);
    runEffects();

    expect(connectivityListeners).toHaveLength(1);
  });

  it("triggers refetch when connectivity is restored", () => {
    mockIsOnline = false;

    useQuery(fakeQuery);
    runEffects();

    // Simulate coming back online
    connectivityListeners[0](true);

    // _version state (index 3) should have been bumped
    expect(stateUpdates.state_3?.at(-1)).toBe(1);
  });

  it("cleans up connectivity listener on unmount", () => {
    mockIsOnline = false;

    useQuery(fakeQuery);
    runEffects();

    expect(connectivityListeners).toHaveLength(1);
    for (const cleanup of effectCleanups) cleanup();
    expect(connectivityListeners).toHaveLength(0);
  });

  it("proceeds with fetch when online", async () => {
    mockIsOnline = true;
    const { gql } = await import("../lib/auth");

    useQuery(fakeQuery);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    expect(gql).toHaveBeenCalled();
  });
});
