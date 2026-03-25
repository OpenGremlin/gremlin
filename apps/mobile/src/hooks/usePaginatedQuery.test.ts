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

const mockGqlResult: unknown = {
  connection: {
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  },
};

vi.mock("../lib/auth", () => ({
  gql: vi.fn(() => Promise.resolve(mockGqlResult)),
}));

vi.mock("../lib/logger", () => ({
  clientLogger: { error: vi.fn() },
}));

let stateUpdates: Record<string, unknown[]> = {};
let effectCleanups: Array<() => void> = [];
let effectCallbacks: Array<() => (() => void) | undefined> = [];

vi.mock("react", () => {
  const refs = new Map<number, { current: unknown }>();
  let refIndex = 0;
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
    useCallback: (fn: unknown) => fn,
    useRef: (initial: unknown) => {
      const idx = refIndex++;
      if (!refs.has(idx)) refs.set(idx, { current: initial });
      return refs.get(idx);
    },
  };
});

import type { TypedDocumentString } from "../graphql/generated/graphql";
import { usePaginatedQuery } from "./usePaginatedQuery";

const fakeQuery = "query { test }" as unknown as TypedDocumentString<
  { connection: unknown },
  Record<string, never>
>;
const selector = (data: { connection: unknown }) => data.connection as any;

function resetMocks() {
  stateUpdates = {};
  effectCallbacks = [];
  effectCleanups = [];
  connectivityListeners = [];
  mockIsOnline = true;
}

function runEffects() {
  for (const fn of effectCallbacks) {
    const cleanup = fn();
    if (typeof cleanup === "function") effectCleanups.push(cleanup);
  }
  effectCallbacks = [];
}

describe("usePaginatedQuery offline behavior", () => {
  beforeEach(resetMocks);

  it("sets error when offline and does not call gql", async () => {
    mockIsOnline = false;
    const { gql } = await import("../lib/auth");

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    // error state (state_3 = error: nodes=0, loading=1, loadingMore=2, error=3)
    expect(stateUpdates.state_3?.at(-1)).toBe("No internet connection");
    // loading set to false
    expect(stateUpdates.state_1?.at(-1)).toBe(false);
    expect(gql).not.toHaveBeenCalled();
  });

  it("subscribes to connectivity changes when offline", () => {
    mockIsOnline = false;

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    expect(connectivityListeners).toHaveLength(1);
  });

  it("triggers refetch when connectivity is restored", () => {
    mockIsOnline = false;

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    connectivityListeners[0](true);

    // _version state (state_5: nodes=0, loading=1, loadingMore=2, error=3, hasMore=4, _version=5)
    expect(stateUpdates.state_5?.at(-1)).toBe(1);
  });

  it("cleans up connectivity listener on unmount", () => {
    mockIsOnline = false;

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    expect(connectivityListeners).toHaveLength(1);
    for (const cleanup of effectCleanups) cleanup();
    expect(connectivityListeners).toHaveLength(0);
  });

  it("proceeds with fetch when online", async () => {
    mockIsOnline = true;
    const { gql } = await import("../lib/auth");

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    expect(gql).toHaveBeenCalled();
  });
});
