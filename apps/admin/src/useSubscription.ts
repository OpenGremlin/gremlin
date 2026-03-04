import { useEffect, useRef } from "react";
import type { TypedDocumentString } from "./graphql/generated/graphql";
import { wsClient } from "./wsClient";

/**
 * WebSocket-based GraphQL subscription hook.
 */
export function useSubscription<TResult>(
  // biome-ignore lint/suspicious/noExplicitAny: needed to accept all TypedDocumentString variable types
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
      { query: queryStr, variables },
      {
        next: ({ data }) => {
          if (data) onDataRef.current(data as TResult);
        },
        error: (err) => {
          console.error("[useSubscription] error:", err);
        },
        complete: () => {},
      },
    );

    return unsubscribe;
  }, [queryStr, serializedVars]);
}
