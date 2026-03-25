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
  const [version, setVersion] = useState(0);

  const serializedVars = variables ? JSON.stringify(variables) : undefined;
  const stableVars = useMemo(
    () =>
      serializedVars
        ? (JSON.parse(serializedVars) as Record<string, unknown>)
        : undefined,
    [serializedVars],
  );

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchVersion = version;

    setData(null);
    setLoading(true);
    setError(null);
    // biome-ignore lint/suspicious/noExplicitAny: implementation passes through to untyped fetch
    gql<TResult, any>(query as any, stableVars as any)
      .then((result) => {
        if (!cancelled && fetchVersion === version) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          clientLogger.error("useQuery failed", { error: msg });
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, stableVars, version]);

  // Auto-refetch when connectivity is restored and the query is in an error state.
  const errorRef = useRef(error);
  errorRef.current = error;
  useEffect(() => {
    return onConnectivityChange((online) => {
      if (online && errorRef.current) refetch();
    });
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
