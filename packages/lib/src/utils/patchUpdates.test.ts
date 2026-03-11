import { describe, expect, it } from "vitest";
import { patchUpdates } from "./patchUpdates.js";

describe("patchUpdates", () => {
  describe("empty input", () => {
    it("returns an empty object for an empty input", () => {
      expect(patchUpdates({})).toEqual({});
    });
  });

  describe("undefined values", () => {
    it("skips keys with undefined values", () => {
      const result = patchUpdates({ name: undefined, age: undefined });
      expect(result).not.toHaveProperty("name");
      expect(result).not.toHaveProperty("age");
    });

    it("skips undefined but keeps other keys", () => {
      const result = patchUpdates({ name: undefined, score: 42 });
      expect(result).not.toHaveProperty("name");
      expect(result).toHaveProperty("score", 42);
    });
  });

  describe("null values", () => {
    it("produces a value for null fields (the $remove marker)", () => {
      const result = patchUpdates({ name: null });
      expect(result).toHaveProperty("name");
    });

    it("produces a $remove marker for each null field", () => {
      const result = patchUpdates({ a: null, b: null });
      expect(result).toHaveProperty("a");
      expect(result).toHaveProperty("b");
    });
  });

  describe("primitive pass-through", () => {
    it("passes strings through unchanged", () => {
      const result = patchUpdates({ name: "Alice" });
      expect(result).toHaveProperty("name", "Alice");
    });

    it("passes numbers through unchanged", () => {
      const result = patchUpdates({ score: 99 });
      expect(result).toHaveProperty("score", 99);
    });

    it("passes zero through unchanged", () => {
      const result = patchUpdates({ count: 0 });
      expect(result).toHaveProperty("count", 0);
    });

    it("passes booleans through unchanged", () => {
      const result = patchUpdates({ active: true, disabled: false });
      expect(result).toHaveProperty("active", true);
      expect(result).toHaveProperty("disabled", false);
    });

    it("passes arrays through unchanged", () => {
      const tags = ["a", "b", "c"];
      const result = patchUpdates({ tags });
      expect(result).toHaveProperty("tags", tags);
    });

    it("passes empty arrays through unchanged", () => {
      const result = patchUpdates({ items: [] });
      expect(result).toHaveProperty("items");
      expect(result.items).toEqual([]);
    });
  });

  describe("plain object values", () => {
    it("wraps a plain object in a $set marker (key exists)", () => {
      const result = patchUpdates({ meta: { foo: "bar" } });
      expect(result).toHaveProperty("meta");
    });

    it("wraps a nested plain object even when it contains nulls", () => {
      const result = patchUpdates({ meta: { foo: null, bar: "baz" } });
      expect(result).toHaveProperty("meta");
    });
  });

  describe("mixed input", () => {
    it("handles all value types together correctly", () => {
      const result = patchUpdates({
        removed: null,
        skipped: undefined,
        kept: "hello",
        count: 7,
        flag: false,
        list: [1, 2],
        nested: { x: 1 },
      });

      expect(result).toHaveProperty("removed");
      expect(result).not.toHaveProperty("skipped");
      expect(result).toHaveProperty("kept", "hello");
      expect(result).toHaveProperty("count", 7);
      expect(result).toHaveProperty("flag", false);
      expect(result).toHaveProperty("list");
      expect(result.list).toEqual([1, 2]);
      expect(result).toHaveProperty("nested");
    });
  });
});
