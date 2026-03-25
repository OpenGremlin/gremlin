import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TypedDocumentString } from "../graphql/generated/graphql";
import { gql } from "../lib/auth";
import { clientLogger } from "../lib/logger";
import { onConnectivityChange } from "../lib/networkState";

export function useQuery<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
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

  const fetchData = useCallback(async () => {
    setData(null);
    setLoading(true);
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
    }
  }, [query, stableVars]);

  useEffect(() => {
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
