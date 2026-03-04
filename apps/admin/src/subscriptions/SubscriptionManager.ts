import { wsClient } from "../wsClient";

type Callback = (entity: Record<string, unknown>) => void;

/**
 * Manages a single WebSocket subscription for a batch subscription type.
 * Collects entity IDs from many components, opens one subscription
 * with all IDs, and dispatches updates to the correct callbacks.
 */
export class SubscriptionManager {
  private registry = new Map<string, Set<Callback>>();
  private unsubscribe: (() => void) | null = null;
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
      cbs?.delete(callback);
      if (cbs?.size === 0) {
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
      this.unsubscribe &&
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
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private connect() {
    this.unsubscribe = wsClient.subscribe(
      {
        query: this.queryStr,
        variables: { [this.variableName]: this.activeIds },
      },
      {
        next: ({ data }) => {
          if (data) this.dispatch(data as Record<string, unknown>);
        },
        error: () => {},
        complete: () => {},
      },
    );
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
