/**
 * WebSocket client bridge — delegates to apolloClient.ts to avoid
 * maintaining two separate WebSocket connections.
 *
 * The custom useSubscription hook and useWsReconnect still reference
 * this module. Once those are fully migrated to Apollo's useSubscription,
 * this file can be removed.
 */
import type { Client } from "graphql-ws";
import { useEffect, useRef } from "react";
import {
  getWsClient as getApolloWsClient,
  reconnectTracker,
} from "./apolloClient";

export { reconnectTracker };

export function initWsClient(): Client {
  return getApolloWsClient();
}

export function getWsClient(): Client {
  return getApolloWsClient();
}

export function tryGetWsClient(): Client | null {
  try {
    return getApolloWsClient();
  } catch {
    return null;
  }
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
