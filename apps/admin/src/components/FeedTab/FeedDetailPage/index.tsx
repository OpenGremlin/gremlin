import Markdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { FEED_ITEM_QUERY } from "../../../queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { FeedItem } from "../../../types";
import { useQuery } from "../../../useQuery";

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

  const { agent } = item;

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="px-4 pt-4 pb-24">
        <BackButton />

        <div className="flex items-center gap-3 mt-6">
          <Link to={`/agents/${agent.id}`}>
            <AgentAvatar
              src={agent.imageUrl}
              name={agent.name}
              status={agent.status}
              size="md"
            />
          </Link>
          <div>
            <span className="text-sm font-medium text-neutral-100">
              {agent.name}
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

        <div className="mt-6 text-sm text-neutral-300 leading-relaxed feed-body">
          <Markdown>{item.body}</Markdown>
        </div>
      </div>
    </div>
  );
}
