import { getToken } from "../auth";

const API_URL =
  (
    (window as unknown as Record<string, unknown>).__GREMLIN_CONFIG__ as
      | { apiUrl?: string }
      | undefined
  )?.apiUrl ||
  (import.meta.env.VITE_API_URL as string) ||
  "";

type Callback = (entity: Record<string, unknown>) => void;

/**
 * Manages a single SSE connection for a batch subscription type.
 * Collects entity IDs from many components, opens one connection
 * with all IDs, and dispatches updates to the correct callbacks.
 */
export class SubscriptionManager {
  private registry = new Map<string, Set<Callback>>();
  private controller: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private activeIds: string[] = [];

  constructor(
    private queryStr: string,
    private variableName: string,
  ) {}

  subscribe(id: string, callback: Callback): () => void {
    let cbs = this.registry.get(id);
    if (!cbs) {
      cbs = new Set();
      this.registry.set(id, cbs);
    }
    cbs.add(callback);
    this.scheduleReconnect();

    return () => {
      cbs!.delete(callback);
      if (cbs!.size === 0) {
        this.registry.delete(id);
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.reconnect();
    }, 50);
  }

  private reconnect() {
    const ids = Array.from(this.registry.keys()).sort();
    // No subscribers — tear down
    if (ids.length === 0) {
      this.disconnect();
      this.activeIds = [];
      return;
    }
    // Same set of IDs — keep existing connection
    if (
      this.controller &&
      ids.length === this.activeIds.length &&
      ids.every((id, i) => id === this.activeIds[i])
    ) {
      return;
    }
    this.disconnect();
    this.activeIds = ids;
    this.connect();
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private connect() {
    const controller = new AbortController();
    this.controller = controller;

    const variables = JSON.stringify({
      [this.variableName]: this.activeIds,
    });
    const params = new URLSearchParams({
      query: this.queryStr,
      variables,
    });

    const token = getToken();
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const run = async () => {
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
            if (!raw) continue;
            try {
              const json = JSON.parse(raw);
              if (json.data) {
                this.dispatch(json.data);
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (!controller.signal.aborted) {
          this.reconnectTimer = setTimeout(() => {
            if (!controller.signal.aborted) run();
          }, 3000);
        }
      }
    };

    run();
  }

  private dispatch(data: Record<string, unknown>) {
    // data is e.g. { tasksUpdated: { id: "...", ... } }
    const entity = Object.values(data)[0] as
      | Record<string, unknown>
      | undefined;
    if (!entity || typeof entity !== "object") return;
    const id = entity.id as string | undefined;
    if (!id) return;

    const cbs = this.registry.get(id);
    if (cbs) {
      for (const cb of cbs) cb(entity);
    }
  }
}
