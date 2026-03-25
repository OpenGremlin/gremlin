import { beforeEach, describe, expect, it, vi } from "vitest";

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

let stateUpdates: Record<string, unknown[]> = {};
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
  mockGqlError = null;
}

function runEffects() {
  for (const fn of effectCallbacks) {
    fn();
  }
  effectCallbacks = [];
}

describe("usePaginatedQuery", () => {
  beforeEach(resetMocks);

  it("calls gql on mount", async () => {
    const { gql } = await import("../lib/auth");

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    expect(gql).toHaveBeenCalled();
  });

  it("sets error on failure", async () => {
    mockGqlError = new Error("boom");

    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    // state_3 = error (nodes=0, loading=1, loadingMore=2, error=3)
    expect(stateUpdates.state_3?.at(-1)).toBe("boom");
  });

  it("sets loading on mount", async () => {
    usePaginatedQuery(fakeQuery, selector);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    // state_1 = loading
    expect(stateUpdates.state_1).toContain(true);
  });
});
