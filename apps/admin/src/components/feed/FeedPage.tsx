import type { FeedItem } from "../../types";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { FeedCard } from "./FeedCard";
import { useQuery } from "../../useQuery";
import { FEED_ITEMS_QUERY } from "../../queries";

export function FeedPage() {
  const { data, loading, error } =
    useQuery<{ feedItems: FeedItem[] }>(FEED_ITEMS_QUERY);

  const feedItems = data?.feedItems ?? [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <PageHeader title="Feed" />

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-4 pb-24">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
