import { describe, expect, it } from "vitest";
import {
  buildConnection,
  decodeCursor,
  encodeCursor,
} from "./pagination.js";

function makeItem(id: string, createdAt: string) {
  return { id, createdAt };
}

describe("encodeCursor / decodeCursor", () => {
  it("roundtrips correctly", () => {
    const item = makeItem("abc-123", "2025-01-15T10:30:00Z");
    const cursor = encodeCursor(item);
    const decoded = decodeCursor(cursor);
    expect(decoded).toBe("2025-01-15T10:30:00Z#abc-123");
  });

  it("produces a base64 string", () => {
    const cursor = encodeCursor(makeItem("id1", "2025-01-01T00:00:00Z"));
    expect(() => Buffer.from(cursor, "base64")).not.toThrow();
    // Should not be the same as the raw value
    expect(cursor).not.toBe("2025-01-01T00:00:00Z#id1");
  });
});

describe("buildConnection", () => {
  const items = [
    makeItem("a", "2025-01-01T00:00:00Z"),
    makeItem("b", "2025-01-02T00:00:00Z"),
    makeItem("c", "2025-01-03T00:00:00Z"),
  ];

  describe("forward pagination (first/after)", () => {
    it("sets hasNextPage from hasMore and hasPreviousPage from after", () => {
      const conn = buildConnection(items, { first: 3 }, true);
      expect(conn.pageInfo.hasNextPage).toBe(true);
      expect(conn.pageInfo.hasPreviousPage).toBe(false);
    });

    it("hasPreviousPage is true when after cursor is provided", () => {
      const conn = buildConnection(items, { first: 3, after: "somecursor" }, false);
      expect(conn.pageInfo.hasNextPage).toBe(false);
      expect(conn.pageInfo.hasPreviousPage).toBe(true);
    });

    it("builds correct edges", () => {
      const conn = buildConnection(items, { first: 3 }, false);
      expect(conn.edges).toHaveLength(3);
      expect(conn.edges[0].node).toBe(items[0]);
      expect(conn.edges[1].node).toBe(items[1]);
      expect(conn.edges[2].node).toBe(items[2]);
      // Each edge has a cursor that decodes to createdAt#id
      expect(decodeCursor(conn.edges[0].cursor)).toBe("2025-01-01T00:00:00Z#a");
    });
  });

  describe("backward pagination (last/before)", () => {
    it("sets hasPreviousPage from hasMore and hasNextPage from before", () => {
      const conn = buildConnection(items, { last: 3 }, true);
      expect(conn.pageInfo.hasPreviousPage).toBe(true);
      expect(conn.pageInfo.hasNextPage).toBe(false);
    });

    it("hasNextPage is true when before cursor is provided", () => {
      const conn = buildConnection(items, { last: 3, before: "somecursor" }, false);
      expect(conn.pageInfo.hasNextPage).toBe(true);
      expect(conn.pageInfo.hasPreviousPage).toBe(false);
    });
  });

  describe("empty items", () => {
    it("returns empty edges and null cursors", () => {
      const conn = buildConnection([], { first: 10 }, false);
      expect(conn.edges).toHaveLength(0);
      expect(conn.pageInfo.startCursor).toBeNull();
      expect(conn.pageInfo.endCursor).toBeNull();
    });

    it("respects hasMore even with empty items", () => {
      const conn = buildConnection([], { first: 10 }, true);
      expect(conn.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("startCursor / endCursor", () => {
    it("are null when items is empty", () => {
      const conn = buildConnection([], { first: 5 }, false);
      expect(conn.pageInfo.startCursor).toBeNull();
      expect(conn.pageInfo.endCursor).toBeNull();
    });

    it("match first and last edge cursors when items exist", () => {
      const conn = buildConnection(items, { first: 3 }, false);
      expect(conn.pageInfo.startCursor).toBe(conn.edges[0].cursor);
      expect(conn.pageInfo.endCursor).toBe(conn.edges[2].cursor);
    });

    it("are the same when there is exactly one item", () => {
      const single = [makeItem("only", "2025-06-01T00:00:00Z")];
      const conn = buildConnection(single, { first: 1 }, false);
      expect(conn.pageInfo.startCursor).toBe(conn.pageInfo.endCursor);
      expect(conn.pageInfo.startCursor).not.toBeNull();
    });
  });
});
