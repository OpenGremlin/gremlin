import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("../auth", () => ({
  gql: vi.fn(),
}));

vi.mock("../logger", () => ({
  clientLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { gql } from "../auth";
import { useQuery } from "./useQuery";

const mockGql = gql as Mock;

const QUERY = {
  toString: () => "query Test { test { id } }",
} as any;

beforeEach(() => {
  mockGql.mockReset();
});

describe("useQuery", () => {
  it("returns loading=true initially, then data after resolve", async () => {
    mockGql.mockResolvedValueOnce({ test: { id: "1" } });

    const { result } = renderHook(() => useQuery(QUERY));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ test: { id: "1" } });
    expect(result.current.error).toBeNull();
  });

  it("sets error on rejection", async () => {
    mockGql.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useQuery(QUERY));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
    expect(result.current.data).toBeNull();
  });

  it("refetch triggers re-fetch", async () => {
    mockGql.mockResolvedValueOnce({ test: { id: "1" } });

    const { result } = renderHook(() => useQuery(QUERY));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ test: { id: "1" } });

    mockGql.mockResolvedValueOnce({ test: { id: "2" } });
    act(() => result.current.refetch());

    await waitFor(() =>
      expect(result.current.data).toEqual({ test: { id: "2" } }),
    );
    expect(mockGql).toHaveBeenCalledTimes(2);
  });

  it("variable changes trigger re-fetch", async () => {
    mockGql.mockResolvedValueOnce({ test: { id: "1" } });

    const { result, rerender } = renderHook(
      ({ vars }: { vars: Record<string, unknown> }) => useQuery(QUERY, vars),
      { initialProps: { vars: { agentId: "a1" } } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ test: { id: "1" } });

    mockGql.mockResolvedValueOnce({ test: { id: "2" } });
    rerender({ vars: { agentId: "a2" } });

    await waitFor(() =>
      expect(result.current.data).toEqual({ test: { id: "2" } }),
    );
    expect(mockGql).toHaveBeenCalledTimes(2);
  });

  it("variable serialization produces stable references (same content = no re-fetch)", async () => {
    mockGql.mockResolvedValueOnce({ test: { id: "1" } });

    const { result, rerender } = renderHook(
      ({ vars }: { vars: Record<string, unknown> }) => useQuery(QUERY, vars),
      { initialProps: { vars: { agentId: "a1" } } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Re-render with a new object reference but same content
    rerender({ vars: { agentId: "a1" } });

    // Wait a tick to ensure no additional fetch is triggered
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockGql).toHaveBeenCalledTimes(1);
  });
});
