import { FEED_QUERY } from "../../queries";
import { QueryResult } from "../../shared/QueryResult";
import type { Task } from "../../types";
import { useQuery } from "../../useQuery";
import { FeedCard } from "./FeedCard";

export function FeedTab() {
  const { data, loading, error } = useQuery<{ feed: Task[] }>(
    FEED_QUERY,
  );

  const tasks = data?.feed ?? [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50 pb-24">
        {tasks.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
