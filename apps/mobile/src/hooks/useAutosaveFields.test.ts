import { describe, expect, it, vi, beforeEach } from "vitest";

// ── React mock ──────────────────────────────────────────────────────────
type SetterMap = Record<string, (v: string) => void>;
const state: Record<string, string> = {};
const setters: SetterMap = {};
let stateIdx = 0;
const stateKeys = ["name", "personality", "role", "delegationHint"];

const effectCleanups: (() => void)[] = [];
const callbackStore = new Map<string, Function>();
let cbIdx = 0;

vi.mock("react", () => ({
  useState: (initial: string) => {
    const key = stateKeys[stateIdx % stateKeys.length];
    state[key] = initial;
    setters[key] = (v: string) => {
      state[key] = v;
    };
    stateIdx++;
    return [state[key], setters[key]];
  },
  useCallback: (fn: Function, _deps: unknown[]) => {
    const key = `cb-${cbIdx++}`;
    callbackStore.set(key, fn);
    return fn;
  },
  useEffect: (fn: () => (() => void) | void) => {
    const cleanup = fn();
    if (typeof cleanup === "function") effectCleanups.push(cleanup);
  },
  useRef: (initial: unknown) => {
    const ref = { current: initial };
    return ref;
  },
}));

import { useAutosaveFields } from "./useAutosaveFields";

function setup(saveFn?: vi.Mock) {
  stateIdx = 0;
  cbIdx = 0;
  effectCleanups.length = 0;
  callbackStore.clear();
  const save = saveFn ?? vi.fn(() => Promise.resolve());
  const result = useAutosaveFields(save);
  return { save, ...result };
}

describe("useAutosaveFields", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("initializes all fields to empty strings", () => {
    setup();
    expect(state.name).toBe("");
    expect(state.personality).toBe("");
    expect(state.role).toBe("");
    expect(state.delegationHint).toBe("");
  });

  it("updates local state on field change", () => {
    const { update } = setup();
    update("name", "Alice");
    expect(state.name).toBe("Alice");
  });

  it("debounces saves — no call before 600ms", () => {
    const { update, save } = setup();
    update("name", "Bob");
    vi.advanceTimersByTime(500);
    expect(save).not.toHaveBeenCalled();
  });

  it("fires save after 600ms debounce", async () => {
    const { update, save } = setup();
    update("name", "Charlie");
    vi.advanceTimersByTime(600);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Charlie" }),
    );
  });

  it("resets debounce on rapid edits", () => {
    const { update, save } = setup();
    update("name", "D");
    vi.advanceTimersByTime(400);
    update("name", "Da");
    vi.advanceTimersByTime(400);
    // Only 800ms total, but second edit reset the timer so only 400ms since last
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Da" }),
    );
  });

  it("skips save when values match server state (no-op)", () => {
    const { update, syncFromServer, save } = setup();
    syncFromServer({
      name: "Same",
      personality: "",
      role: "",
      delegationHint: "",
    });
    // Type the same value (with trailing space — trimmed version matches server)
    update("name", "Same ");
    vi.advanceTimersByTime(600);
    expect(save).not.toHaveBeenCalled();
  });

  it("syncFromServer updates state when not dirty", () => {
    const { syncFromServer } = setup();
    syncFromServer({
      name: "Server",
      personality: "Friendly",
      role: "Dev",
      delegationHint: "When X",
    });
    expect(state.name).toBe("Server");
    expect(state.personality).toBe("Friendly");
    expect(state.role).toBe("Dev");
    expect(state.delegationHint).toBe("When X");
  });

  it("syncFromServer skips state update when dirty", () => {
    const { update, syncFromServer } = setup();
    update("name", "Local edit");
    // Now dirty — server sync should not overwrite
    syncFromServer({
      name: "Server value",
      personality: "",
      role: "",
      delegationHint: "",
    });
    expect(state.name).toBe("Local edit");
  });

  it("flushes pending save on unmount when dirty", () => {
    const { update, save } = setup();
    update("name", "Unmounting");
    // Simulate unmount before debounce fires
    for (const cleanup of effectCleanups) cleanup();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Unmounting" }),
    );
  });

  it("does not flush on unmount when clean", () => {
    const { save } = setup();
    // No edits — unmount should not save
    for (const cleanup of effectCleanups) cleanup();
    expect(save).not.toHaveBeenCalled();
  });

  it("clears dirty after save resolves so server sync resumes", async () => {
    const { update, syncFromServer, save } = setup();
    // Edit → debounce fires → mutation resolves → dirty should clear
    update("name", "Edited");
    vi.advanceTimersByTime(600);
    expect(save).toHaveBeenCalledTimes(1);
    // Let the .finally() run
    await Promise.resolve();
    // Now dirty should be false — syncFromServer should apply
    syncFromServer({
      name: "From server",
      personality: "",
      role: "",
      delegationHint: "",
    });
    expect(state.name).toBe("From server");
  });
});
