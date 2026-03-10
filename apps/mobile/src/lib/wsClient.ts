import { createClient } from "graphql-ws";
import { getTokenSync } from "./auth";
import { getApiUrl } from "./config";
import { clientLogger } from "./logger";

const API_URL = getApiUrl();
const wsUrl = `${API_URL.replace(/^http/, "ws")}/graphql`;

export const wsClient = createClient({
  url: wsUrl,
  connectionParams: () => {
    const token = getTokenSync();
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
        code: (event as { code?: number })?.code,
        reason: (event as { reason?: string })?.reason,
      }),
    error: (error) =>
      clientLogger.error("WebSocket error", {
        message: String(error),
      }),
  },
});
