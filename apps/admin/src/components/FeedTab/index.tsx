import { STATUSES_QUERY } from "../../queries";
import { QueryResult } from "../../shared/QueryResult";
import type { Status } from "../../types";
import { useQuery } from "../../useQuery";
import { FeedCard } from "./FeedCard";

export function FeedTab() {
  const { data, loading, error } = useQuery<{ statuses: Status[] }>(
    STATUSES_QUERY,
  );

  const statuses = data?.statuses ?? [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50 pb-24">
        {statuses.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
