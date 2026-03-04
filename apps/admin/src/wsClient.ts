import { createClient } from "graphql-ws";
import { getToken } from "./auth";

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
    await new Promise((resolve) => setTimeout(resolve, delay));
  },
});
