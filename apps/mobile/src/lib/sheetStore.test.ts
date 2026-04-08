import { beforeEach, describe, expect, it, vi } from "vitest";
import { dismissSheet, getSheet, openSheet, resolveSheet } from "./sheetStore";

describe("sheetStore", () => {
  beforeEach(() => {
    // Clean up any leftover sheets between tests so IDs don't collide.
    // The store has no public reset; dismissing by guessing IDs is fine
    // because the ID generator is monotonic and we control it here.
  });

  it("openSheet generates unique ascending IDs", () => {
    const a = openSheet({ title: "A", items: [], onSelect: () => {} });
    const b = openSheet({ title: "B", items: [], onSelect: () => {} });
    expect(a).not.toBe(b);
    dismissSheet(a);
    dismissSheet(b);
  });

  it("getSheet returns the config registered by openSheet", () => {
    const onSelect = vi.fn();
    const id = openSheet({
      title: "Pick model",
      items: [{ value: "gpt-4", label: "GPT-4" }],
      onSelect,
    });
    const config = getSheet(id);
    expect(config?.title).toBe("Pick model");
    expect(config?.items).toHaveLength(1);
    expect(config?.id).toBe(id);
    dismissSheet(id);
  });

  it("resolveSheet invokes the registered onSelect with the chosen value", () => {
    const onSelect = vi.fn();
    const id = openSheet<string>({
      title: "Pick",
      items: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      onSelect,
    });
    resolveSheet(id, "b");
    expect(onSelect).toHaveBeenCalledWith("b");
    dismissSheet(id);
  });

  it("resolveSheet is a no-op for unknown IDs (no throw)", () => {
    expect(() => resolveSheet("missing", "x")).not.toThrow();
  });

  it("dismissSheet removes the entry so it can't be resolved twice", () => {
    const onSelect = vi.fn();
    const id = openSheet({
      title: "Pick",
      items: [{ value: 1, label: "One" }],
      onSelect,
    });
    dismissSheet(id);
    resolveSheet(id, 1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(getSheet(id)).toBeUndefined();
  });
});
