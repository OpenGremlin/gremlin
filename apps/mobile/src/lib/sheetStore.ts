import { useSyncExternalStore } from "react";

/**
 * Cross-route bridge for sheets that need to hand back a value to whoever
 * opened them. Route params can carry IDs and short strings, but they
 * can't carry callbacks or arbitrary item lists, so the opener stashes a
 * config in this in-memory store under a unique ID, navigates to the
 * sheet route with that ID as a param, and the sheet route reads its
 * config back here.
 *
 * Lifecycle:
 *
 *   1. Opener calls `openSheet(config)` which generates an ID, registers
 *      the config, and returns the ID.
 *   2. Opener navigates to the sheet route with `?id=<id>`.
 *   3. Sheet route calls `useSheet(id)` to read its config and renders
 *      the items.
 *   4. On selection, the sheet route calls `resolveSheet(id, value)`,
 *      which invokes the opener's `onSelect`, then pops the route.
 *   5. On dismissal (swipe / X / back), the route's cleanup effect
 *      calls `dismissSheet(id)` so the entry doesn't leak.
 *
 * The store is intentionally tiny — no persistence, no react context,
 * no provider. It exists for the milliseconds between push and pop.
 */

type SheetConfig<T = unknown> = {
  /** Stable identifier the sheet route reads from its `id` param. */
  id: string;
  /** Title rendered in the sheet header. */
  title: string;
  /** Items the picker should render. */
  items: ReadonlyArray<SheetItem<T>>;
  /** Currently selected value, used to highlight the active row. */
  selectedValue?: T;
  /** Called with the chosen value. The sheet pops itself afterwards. */
  onSelect: (value: T) => void;
  /** Optional placeholder for the search bar. Hides search when omitted. */
  searchPlaceholder?: string;
};

export type SheetItem<T = unknown> = {
  value: T;
  label: string;
  /** Optional second line under the label. */
  description?: string;
};

const store = new Map<string, SheetConfig>();
const listeners = new Set<() => void>();
let nextId = 0;

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return store;
}

/** Register a sheet config and return its generated ID. */
export function openSheet<T>(config: Omit<SheetConfig<T>, "id">): string {
  nextId += 1;
  const id = `sheet-${nextId}`;
  store.set(id, { ...config, id } as SheetConfig);
  notify();
  return id;
}

/** Read a sheet config (used by the sheet route). */
export function getSheet<T>(id: string): SheetConfig<T> | undefined {
  return store.get(id) as SheetConfig<T> | undefined;
}

/** Resolve a sheet with the chosen value. Calls the opener's onSelect. */
export function resolveSheet<T>(id: string, value: T): void {
  const config = store.get(id);
  if (!config) return;
  (config.onSelect as (v: T) => void)(value);
}

/** Remove a sheet from the store. Call from the route's cleanup effect. */
export function dismissSheet(id: string): void {
  if (store.delete(id)) notify();
}

/**
 * Hook for the sheet route to subscribe to its config. Returns undefined
 * if the entry has been dismissed (e.g. after fast double-back), so the
 * route can render nothing instead of throwing.
 */
export function useSheet<T>(
  id: string | undefined,
): SheetConfig<T> | undefined {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!id) return undefined;
  return all.get(id) as SheetConfig<T> | undefined;
}
