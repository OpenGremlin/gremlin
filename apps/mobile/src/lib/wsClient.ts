import { type Client, createClient } from "graphql-ws";
import { useEffect, useRef } from "react";
import { getTokenSync } from "./auth";
import { getApiUrl } from "./config";
import { clientLogger } from "./logger";
import { ReconnectTracker } from "./reconnectTracker";

export const reconnectTracker = new ReconnectTracker();

let _wsClient: Client | null = null;

export function initWsClient(): Client {
  if (_wsClient) return _wsClient;

  const wsUrl = `${getApiUrl().replace(/^http/, "ws")}/graphql`;
  clientLogger.info("Initializing WebSocket client", { url: wsUrl });

  _wsClient = createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = getTokenSync();
      return token ? { token } : {};
    },
    retryAttempts: Number.POSITIVE_INFINITY,
    shouldRetry: () => true,
    retryWait: async (retries) => {
      const delay = Math.min(1000 * 2 ** retries, 30_000);
      clientLogger.warn("WebSocket reconnecting", {
        attempt: retries + 1,
        delayMs: delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
    on: {
      connected: () => {
        clientLogger.info("WebSocket connected");
        reconnectTracker.handleConnected();
      },
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

  return _wsClient;
}

export function getWsClient(): Client {
  if (!_wsClient)
    throw new Error("wsClient not initialized — call initWsClient() first");
  return _wsClient;
}

export function tryGetWsClient(): Client | null {
  return _wsClient;
}

export function useWsReconnect(callback: () => void) {
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(() => {
    const handler = () => ref.current();
    reconnectTracker.addListener(handler);
    return () => {
      reconnectTracker.removeListener(handler);
    };
  }, []);
}
