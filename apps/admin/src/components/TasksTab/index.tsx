import { useEffect, useMemo, useRef } from "react";
import { TasksQuery } from "../../graphql/queries";
import { QueryResult } from "../../shared/QueryResult";
import { usePaginatedQuery } from "../../usePaginatedQuery";
import { TaskCard } from "./TaskCard";

export function TasksTab() {
  const { nodes, loading, loadingMore, error, hasMore, loadMore } =
    usePaginatedQuery(TasksQuery, (d) => d.tasks);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Observe sentinel at the bottom to load older tasks
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // Display newest first
  const tasks = useMemo(() => [...nodes].reverse(), [nodes]);

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
