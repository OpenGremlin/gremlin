import { useEffect, useMemo, useState } from "react";
import type { TypedDocumentString } from "../graphql/generated/graphql";
import { gql } from "../lib/auth";
import { clientLogger } from "../lib/logger";

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
  const [_version, setVersion] = useState(0);

  const serializedVars = variables ? JSON.stringify(variables) : undefined;
  const stableVars = useMemo(
    () =>
      serializedVars
        ? (JSON.parse(serializedVars) as Record<string, unknown>)
        : undefined,
    [serializedVars],
  );

  useEffect(() => {
    let cancelled = false;
    if (_version === 0) {
      setData(null);
      setLoading(true);
    }
    setError(null);
    // biome-ignore lint/suspicious/noExplicitAny: implementation passes through to untyped fetch
    gql<TResult, any>(query as any, stableVars as any)
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [query, stableVars, _version]);

  return {
    data,
    loading,
    error,
    refetch: () => setVersion((v) => v + 1),
    setData,
  };
}
