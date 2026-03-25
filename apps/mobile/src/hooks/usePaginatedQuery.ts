import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TypedDocumentString } from "../graphql/generated/graphql";
import { gql } from "../lib/auth";
import { clientLogger } from "../lib/logger";
import { onConnectivityChange } from "../lib/networkState";

const PAGE_SIZE = 20;

interface Connection<TNode> {
  edges: Array<{ cursor: string; node: TNode }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
}

interface PaginatedQueryOptions {
  direction?: "oldest-first" | "newest-first";
}

export function usePaginatedQuery<TResult, TNode extends { id: string }>(
  // biome-ignore lint/suspicious/noExplicitAny: pagination helper merges cursor params into variables
  query: TypedDocumentString<TResult, any>,
  connectionSelector: (data: TResult) => Connection<TNode>,
  variables?: Record<string, unknown>,
  options?: PaginatedQueryOptions,
) {
  const direction = options?.direction ?? "oldest-first";
  const [nodes, setNodes] = useState<TNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const newestCursorRef = useRef<string | null>(null);

  const serializedVars = variables ? JSON.stringify(variables) : undefined;
  const stableVars = useMemo(
    () =>
      serializedVars
        ? (JSON.parse(serializedVars) as Record<string, unknown>)
        : undefined,
    [serializedVars],
  );

  const selectorRef = useRef(connectionSelector);
  selectorRef.current = connectionSelector;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: pagination merges cursor params
      const result: TResult = await (gql as any)(query, {
        ...stableVars,
        last: PAGE_SIZE,
      });
      const conn = selectorRef.current(result);
      const items = conn.edges.map((e) => e.node);
      setNodes(direction === "newest-first" ? items.reverse() : items);
      setHasMore(conn.pageInfo.hasPreviousPage);
      cursorRef.current = conn.pageInfo.startCursor ?? null;
      newestCursorRef.current = conn.pageInfo.endCursor ?? null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      clientLogger.error("usePaginatedQuery failed", { error: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [query, stableVars, direction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || !hasMore) return;
    setLoadingMore(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: pagination merges cursor params
      const result: TResult = await (gql as any)(query, {
        ...stableVars,
        last: PAGE_SIZE,
        before: cursorRef.current,
      });
      const conn = selectorRef.current(result);
      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = conn.edges
          .map((e) => e.node)
          .filter((n) => !existingIds.has(n.id));
        return direction === "newest-first"
          ? [...prev, ...newItems.reverse()]
          : [...newItems, ...prev];
      });
      setHasMore(conn.pageInfo.hasPreviousPage);
      cursorRef.current = conn.pageInfo.startCursor ?? null;
    } catch (err) {
      clientLogger.error("Failed to load more", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoadingMore(false);
    }
  }, [query, stableVars, hasMore, direction]);

  const appendNode = useCallback(
    (node: TNode) => {
      setNodes((prev) => {
        if (prev.some((n) => n.id === node.id)) return prev;
        return direction === "newest-first" ? [node, ...prev] : [...prev, node];
      });
    },
    [direction],
  );

  const replaceOrAppend = useCallback(
    (node: TNode, predicate: (existing: TNode) => boolean) => {
      setNodes((prev) => {
        const byId = prev.findIndex((n) => n.id === node.id);
        if (byId !== -1) {
          const next = [...prev];
          next[byId] = node;
          return next;
        }
        const idx = prev.findIndex(predicate);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = node;
          return next;
        }
        return direction === "newest-first" ? [node, ...prev] : [...prev, node];
      });
    },
    [direction],
  );

  const fetchNewer = useCallback(async () => {
    if (!newestCursorRef.current) return;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: pagination merges cursor params
      const result: TResult = await (gql as any)(query, {
        ...stableVars,
        first: PAGE_SIZE,
        after: newestCursorRef.current,
      });
      const conn = selectorRef.current(result);
      if (conn.edges.length === 0) return;
      newestCursorRef.current =
        conn.pageInfo.endCursor ?? newestCursorRef.current;
      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = conn.edges
          .map((e) => e.node)
          .filter((n) => !existingIds.has(n.id));
        if (newItems.length === 0) return prev;
        return direction === "newest-first"
          ? [...newItems, ...prev]
          : [...prev, ...newItems];
      });
    } catch (err) {
      clientLogger.error("Failed to fetch newer", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [query, stableVars, direction]);

  const refetch = useCallback(() => {
    setNodes([]);
    cursorRef.current = null;
    newestCursorRef.current = null;
    fetchData();
  }, [fetchData]);

  // Auto-refetch when connectivity is restored and the query is in an error state.
  const errorRef = useRef(error);
  errorRef.current = error;
  useEffect(() => {
    return onConnectivityChange((online) => {
      if (online && errorRef.current) refetch();
    });
  }, [refetch]);

  return {
    nodes,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    fetchNewer,
    appendNode,
    replaceOrAppend,
  };
}
