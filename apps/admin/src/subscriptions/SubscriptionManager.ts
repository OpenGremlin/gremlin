import { clientLogger } from "../logger";
import { wsClient } from "../wsClient";

type Callback = (entity: Record<string, unknown>) => void;

interface Entry {
  refCount: number;
  callbacks: Set<Callback>;
  unsubscribe: () => void;
  lingerTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Manages individual WebSocket subscriptions per entity ID, ref-counted
 * so that duplicate subscribers share a single connection.
 */
export class SubscriptionManager {
  private entries = new Map<string, Entry>();

  constructor(
    private queryStr: string,
    private variableName: string,
  ) {}

  subscribe(id: string, callback: Callback): () => void {
    let entry = this.entries.get(id);

    if (entry) {
      // Reuse existing subscription — cancel linger if pending
      if (entry.lingerTimer) {
        clearTimeout(entry.lingerTimer);
        entry.lingerTimer = null;
      }
      entry.refCount++;
      entry.callbacks.add(callback);
      clientLogger.debug("SubscriptionManager reused subscription", {
        variable: this.variableName,
        id,
        refCount: entry.refCount,
      });
    } else {
      // Open a new individual subscription
      clientLogger.debug("SubscriptionManager opening subscription", {
        variable: this.variableName,
        id,
      });
      const callbacks = new Set<Callback>([callback]);
      const unsubscribe = wsClient.subscribe(
        {
          query: this.queryStr,
          variables: { [this.variableName]: id },
        },
        {
          next: ({ data }) => {
            if (!data) return;
            const entity = Object.values(data)[0] as
              | Record<string, unknown>
              | undefined;
            if (!entity || typeof entity !== "object") return;
            for (const cb of callbacks) cb(entity);
          },
          error: (err) => {
            clientLogger.error("SubscriptionManager subscription error", {
              variable: this.variableName,
              id,
              error: String(err),
            });
          },
          complete: () => {},
        },
      );
      entry = { refCount: 1, callbacks, unsubscribe, lingerTimer: null };
      this.entries.set(id, entry);
    }

    return () => {
      if (!entry) return;
      entry.callbacks.delete(callback);
      entry.refCount--;

      if (entry.refCount <= 0) {
        clientLogger.debug("SubscriptionManager lingering before teardown", {
          variable: this.variableName,
          id,
        });
        // Linger for 1s before tearing down — covers page transitions
        entry.lingerTimer = setTimeout(() => {
          clientLogger.debug("SubscriptionManager tearing down subscription", {
            variable: this.variableName,
            id,
          });
          entry!.unsubscribe();
          this.entries.delete(id);
        }, 1000);
      }
    };
  }
}
