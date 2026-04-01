import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "../lib/auth";
import { clientLogger } from "../lib/logger";
import { onConnectivityChange } from "../lib/networkState";

export function useQuery<TResult, TVariables>(
  query: TypedDocumentNode<TResult, TVariables>,
  ...args: Record<string, never> extends TVariables
    ? [variables?: TVariables]
    : [variables: TVariables]
): {
  data: TResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setData: (data: TResult) => void;
} {
  const [variables] = args;
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serializedVars = variables ? JSON.stringify(variables) : undefined;
  const stableVars = useMemo(
    () =>
      serializedVars
        ? (JSON.parse(serializedVars) as Record<string, unknown>)
        : undefined,
    [serializedVars],
  );

  const isInitialFetch = useRef(true);

  const fetchData = useCallback(async () => {
    // Only show loading spinner on the initial fetch — keep stale data
    // visible during background refetches to avoid flicker and scroll jumps.
    if (isInitialFetch.current) {
      setData(null);
      setLoading(true);
    }
    setError(null);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: implementation passes through to untyped fetch
      const result = await gql<TResult, any>(query as any, stableVars as any);
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      clientLogger.error("useQuery failed", { error: msg });
      setError(msg);
    } finally {
      setLoading(false);
      isInitialFetch.current = false;
    }
  }, [query, stableVars]);

  useEffect(() => {
    isInitialFetch.current = true;
    fetchData();
  }, [fetchData]);

  // Auto-refetch when connectivity is restored and the query is in an error state.
  const errorRef = useRef(error);
  errorRef.current = error;
  useEffect(() => {
    return onConnectivityChange((online) => {
      if (online && errorRef.current) fetchData();
    });
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
