import { useCallback, useEffect, useRef, useState } from "react";
import { gql } from "../../auth";
import type { TasksQuery as TasksQueryType } from "../../graphql/generated/graphql";
import { TasksQuery } from "../../graphql/queries";
import { QueryResult } from "../../shared/QueryResult";
import { TaskCard } from "./TaskCard";

const PAGE_SIZE = 20;

type TaskEdge = TasksQueryType["tasks"]["edges"][number];

export function TasksTab() {
  const [edges, setEdges] = useState<TaskEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const isInitial = cursor === null;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const vars: Record<string, unknown> = { last: PAGE_SIZE };
      if (cursor) vars.before = cursor;
      const result = await gql<TasksQueryType>(TasksQuery, vars);
      const newEdges = result.tasks.edges;
      // Initial load is newest; subsequent pages are older, appended below
      setEdges((prev) => (isInitial ? newEdges : [...prev, ...newEdges]));
      setHasMore(result.tasks.pageInfo.hasPreviousPage);
      cursorRef.current = result.tasks.pageInfo.startCursor ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(null);
  }, [fetchPage]);

  // Observe sentinel at the bottom to load older tasks
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPage(cursorRef.current);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchPage]);

  const tasks = edges.map((e) => e.node);

  return (
    <div className="min-h-screen bg-neutral-950">
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50 pb-24">
        {tasks.map((item) => (
          <TaskCard key={item.id} item={item} />
        ))}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="py-4 text-center text-xs text-neutral-500"
          >
            {loadingMore ? "Loading..." : ""}
          </div>
        )}
      </div>
    </div>
  );
}
