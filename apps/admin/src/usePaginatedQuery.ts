import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "./auth";
import type { TypedDocumentString } from "./graphql/generated/graphql";

const PAGE_SIZE = 20;

interface Connection<TNode> {
  edges: Array<{ cursor: string; node: TNode }>;
  pageInfo: {
    hasPreviousPage: boolean;
    startCursor?: string | null;
  };
}

export function usePaginatedQuery<TResult, TNode extends { id: string }>(
  // biome-ignore lint/suspicious/noExplicitAny: needed to accept all TypedDocumentString variable types
  query: TypedDocumentString<TResult, any>,
  connectionSelector: (data: TResult) => Connection<TNode>,
  variables?: Record<string, unknown>,
) {
  const [nodes, setNodes] = useState<TNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const startCursorRef = useRef<string | null>(null);

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
        setNodes(conn.edges.map((e) => e.node));
        setHasMore(conn.pageInfo.hasPreviousPage);
        startCursorRef.current = conn.pageInfo.startCursor ?? null;
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
  }, [query, stableVars]);

  const loadMore = useCallback(async () => {
    if (!startCursorRef.current || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await gql<TResult>(query, {
        ...stableVars,
        last: PAGE_SIZE,
        before: startCursorRef.current,
      });
      const conn = selectorRef.current(result);
      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newNodes = conn.edges
          .map((e) => e.node)
          .filter((n) => !existingIds.has(n.id));
        return [...newNodes, ...prev];
      });
      setHasMore(conn.pageInfo.hasPreviousPage);
      startCursorRef.current = conn.pageInfo.startCursor ?? null;
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [query, stableVars, hasMore]);

  const appendNode = useCallback((node: TNode) => {
    setNodes((prev) => {
      if (prev.some((n) => n.id === node.id)) return prev;
      return [...prev, node];
    });
  }, []);

  return { nodes, loading, loadingMore, error, hasMore, loadMore, appendNode };
}
