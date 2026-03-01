import { useEffect, useRef } from "react";
import { getToken } from "./auth";

const API_URL =
  ((window as unknown as Record<string, unknown>).__GREMLIN_CONFIG__ as
    | { apiUrl?: string }
    | undefined)?.apiUrl ||
  (import.meta.env.VITE_API_URL as string) ||
  "";

/**
 * SSE-based GraphQL subscription hook for Yoga.
 * Connects via GET with Accept: text/event-stream.
 */
export function useSubscription<T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const serializedVars = JSON.stringify(variables);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();

    async function connect() {
      const token = getToken();
      const params = new URLSearchParams({
        query,
        variables: serializedVars,
      });

      const headers: Record<string, string> = {
        Accept: "text/event-stream",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`${API_URL}/graphql?${params.toString()}`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "") continue;
            try {
              const json = JSON.parse(raw);
              if (json.data) {
                onDataRef.current(json.data);
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // Reconnect after a delay on errors
        if (!controller.signal.aborted) {
          setTimeout(() => {
            if (!controller.signal.aborted) connect();
          }, 3000);
        }
      }
    }

    connect();

    return () => controller.abort();
  }, [query, serializedVars]);
}
