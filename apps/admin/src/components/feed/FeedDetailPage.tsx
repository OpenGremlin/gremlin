import { useParams } from "react-router-dom";
import type { FeedItem } from "../../types";
import { BackButton } from "../../shared/BackButton";
import { Badge } from "../../shared/Badge";
import { formatDate } from "../../shared/formatDate";
import { QueryResult, NotFound } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { FEED_ITEM_QUERY } from "../../queries";

export function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ feedItem: FeedItem | null }>(
    FEED_ITEM_QUERY,
    { id },
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const item = data?.feedItem ?? null;

  if (!item) {
    return <NotFound label="Feed item not found." />;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="px-4 pt-4 pb-24">
        <BackButton />

        <div className="flex items-center gap-3 mt-6">
          <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.agentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.textContent =
                  item.agentName[0];
              }}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-100">
              {item.agentName}
            </span>
            <p className="text-xs text-neutral-500">
              {formatDate(item.completedAt)}
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
