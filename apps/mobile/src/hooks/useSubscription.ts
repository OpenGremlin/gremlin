import { useEffect, useMemo, useRef } from "react";
import type { TypedDocumentString } from "../graphql/generated/graphql";
import { clientLogger } from "../lib/logger";
import { wsClient } from "../lib/wsClient";

export function useSubscription<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
  onData: (data: TResult) => void,
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const queryStr = String(query);
  const serializedVars = JSON.stringify(variables);
  const stableVars = useMemo(
    () => JSON.parse(serializedVars) as Record<string, unknown>,
    [serializedVars],
  );

  useEffect(() => {
    if (!queryStr) return;

    const unsubscribe = wsClient.subscribe(
      { query: queryStr, variables: stableVars },
      {
        next: ({ data }) => {
          if (data) onDataRef.current(data as TResult);
        },
        error: (err) => {
          clientLogger.error("Subscription error", {
            error: String(err),
          });
        },
        complete: () => {},
      },
    );

    return unsubscribe;
  }, [queryStr, stableVars]);
}
