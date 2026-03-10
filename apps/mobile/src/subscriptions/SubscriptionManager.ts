import { clientLogger } from "../lib/logger";
import { wsClient } from "../lib/wsClient";

type Callback = (entity: Record<string, unknown>) => void;

interface Entry {
  refCount: number;
  callbacks: Set<Callback>;
  unsubscribe: () => void;
  lingerTimer: ReturnType<typeof setTimeout> | null;
}

export class SubscriptionManager {
  private entries = new Map<string, Entry>();

  constructor(
    private queryStr: string,
    private variableName: string,
  ) {}

  subscribe(id: string, callback: Callback): () => void {
    let entry = this.entries.get(id);

    if (entry) {
      if (entry.lingerTimer) {
        clearTimeout(entry.lingerTimer);
        entry.lingerTimer = null;
      }
      entry.refCount++;
      entry.callbacks.add(callback);
    } else {
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
        entry.lingerTimer = setTimeout(() => {
          entry?.unsubscribe();
          this.entries.delete(id);
        }, 1000);
      }
    };
  }
}
