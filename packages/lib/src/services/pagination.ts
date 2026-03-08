/**
 * Generic cursor-based pagination for DynamoDB GSI queries.
 *
 * Nodes must have `id` and `createdAt` fields. The cursor encodes
 * `createdAt#id` so pagination boundaries are always unique, even
 * when multiple items share the same timestamp.
 *
 * Usage:
 *   type MyConnection = Connection<MyItem>;
 *   type MyEdge = Edge<MyItem>;
 *   const result = buildConnection(items, args, hasMore, cursorFor);
 */

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

export function encodeCursor(item: { createdAt: string; id: string }): string {
  return Buffer.from(`${item.createdAt}#${item.id}`).toString("base64");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

export function buildConnection<T extends { createdAt: string; id: string }>(
  items: T[],
  args: PaginationArgs,
  hasMore: boolean,
): Connection<T> {
  const isBackward = args.last != null;

  const edges: Edge<T>[] = items.map((item) => ({
    cursor: encodeCursor(item),
    node: item,
  }));

  const pageInfo: PageInfo = {
    hasNextPage: isBackward ? args.before != null : hasMore,
    hasPreviousPage: isBackward ? hasMore : args.after != null,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
  };

  return { edges, pageInfo };
}
