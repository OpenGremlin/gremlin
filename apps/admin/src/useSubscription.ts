import { useEffect, useRef } from "react";
import type { TypedDocumentString } from "./graphql/generated/graphql";
import { wsClient } from "./wsClient";

/**
 * WebSocket-based GraphQL subscription hook.
 */
// biome-ignore lint: any is needed to accept all TypedDocumentString variable types
export function useSubscription<TResult>(
  query: TypedDocumentString<TResult, any> | string,
  variables: Record<string, unknown>,
  onData: (data: TResult) => void,
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const queryStr = String(query);
  const serializedVars = JSON.stringify(variables);

  useEffect(() => {
    if (!queryStr) return;

    const unsubscribe = wsClient.subscribe(
      { query: queryStr, variables: JSON.parse(serializedVars) },
      {
        next: ({ data }) => {
          if (data) onDataRef.current(data as TResult);
        },
        error: () => {},
        complete: () => {},
      },
    );

    return unsubscribe;
  }, [queryStr, serializedVars]);
}
