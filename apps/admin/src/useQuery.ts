import { useEffect, useMemo, useState } from "react";
import { gql } from "./auth";
import type { TypedDocumentString } from "./graphql/generated/graphql";

export function useQuery<TResult>(
  // biome-ignore lint/suspicious/noExplicitAny: needed to accept all TypedDocumentString variable types
  query: TypedDocumentString<TResult, any>,
  variables?: Record<string, unknown>,
): {
  data: TResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
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
    setData(null);
    setLoading(true);
    setError(null);
    gql<TResult>(query, stableVars)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
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
  };
}
