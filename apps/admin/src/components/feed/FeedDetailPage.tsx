import { useParams } from "react-router-dom";
import type { FeedItem } from "../../types";
import { BackButton } from "../../shared/BackButton";
import { Avatar } from "../../shared/Avatar";
import { Badge } from "../../shared/Badge";
import { useQuery } from "../../useQuery";
import { FEED_ITEM_QUERY } from "../../queries";

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ feedItem: FeedItem | null }>(
    FEED_ITEM_QUERY,
    { id },
  );

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-500 mt-4 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-red-400 mt-4 text-sm">Error: {error}</p>
      </div>
    );
  }

  const item = data?.feedItem ?? null;

  if (!item) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-400 mt-4">Feed item not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="px-4 pt-4 pb-24">
        <BackButton />

        <div className="flex items-center gap-3 mt-6">
          <Avatar name={item.agentName} />
          <div>
            <span className="text-sm font-medium text-neutral-100">
              {item.agentName}
            </span>
            <p className="text-xs text-neutral-500">
              {formatTimestamp(item.completedAt)}
            </p>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-neutral-100 mt-4">
          {item.title}
        </h1>

        <div className="mt-2">
          <Badge label={item.category} />
        </div>

        <div className="mt-6 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {item.body}
        </div>
      </div>
    </div>
  );
}
