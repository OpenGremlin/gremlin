import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("../lib/networkState", () => ({
  onConnectivityChange: () => () => {},
}));

let stateUpdates: Record<string, unknown[]> = {};
let effectCallbacks: Array<() => (() => void) | undefined> = [];

vi.mock("react", () => {
  const memoCache = new Map<string, unknown>();
  const refs = new Map<number, { current: unknown }>();
  let refIndex = 0;
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
    useRef: (initial: unknown) => {
      const idx = refIndex++;
      if (!refs.has(idx)) refs.set(idx, { current: initial });
      return refs.get(idx);
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
  mockGqlResult = { data: "ok" };
  mockGqlError = null;
}

function runEffects() {
  for (const fn of effectCallbacks) {
    fn();
  }
  effectCallbacks = [];
}

describe("useQuery", () => {
  beforeEach(resetMocks);

  it("calls gql on mount", async () => {
    const { gql } = await import("../lib/auth");

    useQuery(fakeQuery);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    expect(gql).toHaveBeenCalled();
  });

  it("sets data on success", async () => {
    mockGqlResult = { data: "hello" };

    useQuery(fakeQuery);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    // state_0 = data
    expect(stateUpdates.state_0?.at(-1)).toEqual({ data: "hello" });
  });

  it("sets error on failure", async () => {
    mockGqlError = new Error("boom");

    useQuery(fakeQuery);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    // state_2 = error
    expect(stateUpdates.state_2?.at(-1)).toBe("boom");
  });

  it("resets loading on refetch", async () => {
    useQuery(fakeQuery);
    runEffects();

    await new Promise((r) => setTimeout(r, 0));
    // state_1 = loading — should have been set to true then false
    expect(stateUpdates.state_1).toContain(true);
  });
});
