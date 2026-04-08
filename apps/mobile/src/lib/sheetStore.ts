import { useSyncExternalStore } from "react";

/**
 * Cross-route bridge for sheets that need to share state with whoever
 * opened them (callbacks, large objects, render props). Route params can
 * carry IDs and short strings, but they can't carry functions or
 * arbitrary objects, so the opener stashes a payload here under a unique
 * ID, navigates to the sheet route with that ID as a param, and the
 * sheet route reads its payload back via useSheetPayload.
 *
 * Lifecycle:
 *
 *   1. Opener calls `openSheet(payload)` which generates an ID, stores
 *      the payload, and returns the ID.
 *   2. Opener navigates to the sheet route with `?id=<id>`.
 *   3. Sheet route calls `useSheetPayload(id)` to read the payload and
 *      renders accordingly.
 *   4. On user action (e.g. picker selection) the sheet route calls
 *      whatever callback the payload exposes, then `router.back()`s.
 *   5. Cleanup effect calls `dismissSheet(id)` so the entry doesn't
 *      leak between presentations.
 *
 * The store is intentionally tiny — no persistence, no provider, no
 * Zustand. It exists for the milliseconds between push and pop. Each
 * caller defines its own payload type.
 */

const store = new Map<string, unknown>();
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

/** Register a sheet payload and return its generated ID. */
export function openSheet<T>(payload: T): string {
  nextId += 1;
  const id = `sheet-${nextId}`;
  store.set(id, payload);
  notify();
  return id;
}

/** Synchronously read a sheet payload (used outside of React). */
export function getSheet<T>(id: string): T | undefined {
  return store.get(id) as T | undefined;
}

/** Remove a sheet from the store. Call from the route's cleanup effect. */
export function dismissSheet(id: string): void {
  if (store.delete(id)) notify();
}

/**
 * Hook for the sheet route to subscribe to its payload. Returns
 * undefined if the entry has been dismissed (e.g. after fast double-
 * back) so the route can render nothing instead of throwing.
 */
export function useSheetPayload<T>(id: string | undefined): T | undefined {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!id) return undefined;
  return all.get(id) as T | undefined;
}

// ---------------------------------------------------------------------------
// Picker payload type — the most common shape.
// ---------------------------------------------------------------------------

export type PickerSheetItem<T = unknown> = {
  value: T;
  label: string;
  /** Optional second line under the label. */
  description?: string;
};

export type PickerSheetPayload<T = unknown> = {
  title: string;
  items: ReadonlyArray<PickerSheetItem<T>>;
  /** Currently selected value, used to highlight the active row. */
  selectedValue?: T;
  /** Called with the chosen value. The sheet pops itself afterwards. */
  onSelect: (value: T) => void;
  /** Optional placeholder for the search bar. Hides search when omitted. */
  searchPlaceholder?: string;
};
