import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "./auth";
import type { TypedDocumentString } from "./graphql/generated/graphql";

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
  /** "newest-first" shows newest on top, loads older on scroll down.
   *  "oldest-first" (default) shows oldest on top, loads older on scroll up. */
  direction?: "oldest-first" | "newest-first";
}

export function usePaginatedQuery<TResult, TNode extends { id: string }>(
  // biome-ignore lint/suspicious/noExplicitAny: needed to accept all TypedDocumentString variable types
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

  const serializedVars = variables ? JSON.stringify(variables) : undefined;
  const stableVars = useMemo(
    () =>
      serializedVars
        ? (JSON.parse(serializedVars) as Record<string, unknown>)
        : undefined,
    [serializedVars],
  );

  // Stable ref for connectionSelector to avoid re-fetching
  const selectorRef = useRef(connectionSelector);
  selectorRef.current = connectionSelector;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    gql<TResult>(query, { ...stableVars, last: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        const conn = selectorRef.current(result);
        const items = conn.edges.map((e) => e.node);
        setNodes(direction === "newest-first" ? items.reverse() : items);
        setHasMore(conn.pageInfo.hasPreviousPage);
        cursorRef.current = conn.pageInfo.startCursor ?? null;
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, stableVars, direction]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await gql<TResult>(query, {
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
      console.error("Failed to load more:", err);
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

  return { nodes, loading, loadingMore, error, hasMore, loadMore, appendNode };
}
