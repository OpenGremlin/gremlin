import { act, renderHook, waitFor } from "@testing-library/react";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  gql: vi.fn(),
}));

import { gql } from "./auth";
import { usePaginatedQuery } from "./usePaginatedQuery";

const mockGql = gql as Mock;

const QUERY = { toString: () => "query Tasks { tasks { edges { cursor node { id } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }" } as any;

function makeConnection(
  nodes: Array<{ id: string }>,
  hasPreviousPage = false,
  startCursor: string | null = null,
) {
  return {
    edges: nodes.map((n, i) => ({ cursor: `c${i}`, node: n })),
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage,
      startCursor,
      endCursor: nodes.length ? `c${nodes.length - 1}` : null,
    },
  };
}

const selector = (d: { tasks: any }) => d.tasks;

beforeEach(() => {
  mockGql.mockReset();
});

describe("usePaginatedQuery", () => {
  it("loads initial data", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }, { id: "2" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nodes).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.current.hasMore).toBe(false);
  });

  it("reverses items for newest-first", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }, { id: "2" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}, { direction: "newest-first" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nodes).toEqual([{ id: "2" }, { id: "1" }]);
  });

  it("loadMore deduplicates by id", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }, { id: "2" }], true, "cursor0"),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Second page has overlap (id: "1") and new item (id: "0")
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "0" }, { id: "1" }]),
    });

    await act(() => result.current.loadMore());

    expect(result.current.nodes).toEqual([{ id: "0" }, { id: "1" }, { id: "2" }]);
  });

  it("appendNode adds to end for oldest-first", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.appendNode({ id: "2" }));
    expect(result.current.nodes).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("appendNode adds to start for newest-first", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}, { direction: "newest-first" }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.appendNode({ id: "2" }));
    expect(result.current.nodes).toEqual([{ id: "2" }, { id: "1" }]);
  });

  it("appendNode skips duplicates", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.appendNode({ id: "1" }));
    expect(result.current.nodes).toEqual([{ id: "1" }]);
  });

  it("replaceOrAppend updates existing by id", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }, { id: "2" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.replaceOrAppend(
        { id: "1", updated: true } as any,
        () => false,
      ),
    );
    expect(result.current.nodes[0]).toEqual({ id: "1", updated: true });
    expect(result.current.nodes).toHaveLength(2);
  });

  it("replaceOrAppend matches by predicate when id doesn't match", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([
        { id: "1", toolName: "run", toolResult: null } as any,
      ]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.replaceOrAppend(
        { id: "2", toolName: "run", toolResult: "done" } as any,
        (n: any) => n.toolName === "run" && !n.toolResult,
      ),
    );
    expect(result.current.nodes[0]).toEqual({
      id: "2",
      toolName: "run",
      toolResult: "done",
    });
    expect(result.current.nodes).toHaveLength(1);
  });

  it("replaceOrAppend appends when no match", async () => {
    mockGql.mockResolvedValueOnce({
      tasks: makeConnection([{ id: "1" }]),
    });

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.replaceOrAppend({ id: "new" }, () => false),
    );
    expect(result.current.nodes).toEqual([{ id: "1" }, { id: "new" }]);
  });

  it("sets error on fetch failure", async () => {
    mockGql.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      usePaginatedQuery(QUERY, selector, {}),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
    expect(result.current.nodes).toEqual([]);
  });
});
