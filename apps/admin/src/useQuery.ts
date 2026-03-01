import { useEffect, useMemo, useState } from "react";
import { gql } from "./auth";

export function useQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);
    gql<T>(query, stableVars)
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
  }, [query, stableVars]);

  return { data, loading, error };
}
