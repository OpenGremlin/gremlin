import { createClient } from "graphql-ws";
import { getToken } from "./auth";
import { clientLogger } from "./logger";

const API_URL =
  (
    (window as unknown as Record<string, unknown>).__GREMLIN_CONFIG__ as
      | { apiUrl?: string }
      | undefined
  )?.apiUrl ||
  (import.meta.env.VITE_API_URL as string) ||
  "";

const wsUrl = `${API_URL.replace(/^http/, "ws")}/graphql`;

export const wsClient = createClient({
  url: wsUrl,
  connectionParams: () => {
    const token = getToken();
    return token ? { token } : {};
  },
  retryAttempts: Number.POSITIVE_INFINITY,
  retryWait: async (retries) => {
    const delay = Math.min(1000 * 2 ** retries, 30_000);
    clientLogger.warn("WebSocket reconnecting", {
      attempt: retries + 1,
      delayMs: delay,
    });
    await new Promise((resolve) => setTimeout(resolve, delay));
  },
  on: {
    connected: () => clientLogger.info("WebSocket connected"),
    closed: (event) =>
      clientLogger.warn("WebSocket closed", {
        code: (event as CloseEvent)?.code,
        reason: (event as CloseEvent)?.reason,
      }),
    error: (error) =>
      clientLogger.error("WebSocket error", {
        message: String(error),
      }),
  },
});
