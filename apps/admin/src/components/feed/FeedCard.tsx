import { Link } from "react-router-dom";
import type { FeedItem } from "../../types";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { Badge } from "../../shared/Badge";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FeedCard({ item }: { item: FeedItem }) {
  const { agent } = item;
  return (
    <Link
      to={`/feed/${item.id}`}
      className="block px-4 py-4 transition-colors hover:bg-neutral-900/50"
    >
      <div className="flex gap-3">
        <Link
          to={`/agents/${agent.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <AgentAvatar src={agent.imageUrl} name={agent.name} status={agent.status} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-neutral-400 truncate">
                {agent.name}
              </span>
              <span className="text-xs text-neutral-600 shrink-0">
                {timeAgo(item.completedAt)}
              </span>
            </div>
            <Badge label={item.category} />
          </div>
          <h3 className="text-sm font-medium text-neutral-100 mt-0.5">
            {item.title}
          </h3>
          <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
            {item.summary}
          </p>
        </div>
      </div>
    </Link>
  );
}
