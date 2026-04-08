import { describe, expect, it, vi } from "vitest";
import { dismissSheet, getSheet, openSheet } from "./sheetStore";

describe("sheetStore", () => {
  it("openSheet generates unique ascending IDs", () => {
    const a = openSheet({ kind: "a" });
    const b = openSheet({ kind: "b" });
    expect(a).not.toBe(b);
    dismissSheet(a);
    dismissSheet(b);
  });

  it("getSheet returns the payload registered by openSheet", () => {
    const payload = { title: "Pick model", count: 3 };
    const id = openSheet(payload);
    expect(getSheet<typeof payload>(id)).toEqual(payload);
    dismissSheet(id);
  });

  it("payload may contain functions (callbacks)", () => {
    const onSelect = vi.fn();
    type Payload = { onSelect: (v: string) => void };
    const id = openSheet<Payload>({ onSelect });
    const stored = getSheet<Payload>(id);
    stored?.onSelect("hello");
    expect(onSelect).toHaveBeenCalledWith("hello");
    dismissSheet(id);
  });

  it("dismissSheet removes the entry so getSheet returns undefined", () => {
    const id = openSheet({ x: 1 });
    dismissSheet(id);
    expect(getSheet(id)).toBeUndefined();
  });

  it("dismissSheet on an unknown id is a silent no-op", () => {
    expect(() => dismissSheet("missing")).not.toThrow();
  });
});
