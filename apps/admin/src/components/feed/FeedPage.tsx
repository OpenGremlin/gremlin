import { FEED_ITEMS_QUERY } from "../../queries";
import { QueryResult } from "../../shared/QueryResult";
import type { FeedItem } from "../../types";
import { useQuery } from "../../useQuery";
import { FeedCard } from "./FeedCard";

export function FeedPage() {
  const { data, loading, error } = useQuery<{ feedItems: FeedItem[] }>(
    FEED_ITEMS_QUERY,
  );

  const feedItems = data?.feedItems ?? [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50 pb-24">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
