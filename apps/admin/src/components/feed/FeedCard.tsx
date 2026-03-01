import { Link } from "react-router-dom";
import type { FeedItem } from "../../types";
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
      className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
    >
      <div className="flex gap-3">
        <div
          className={`w-12 h-12 shrink-0 flex items-center justify-center avatar-ring ${
            agent.status === "ACTIVE"
              ? "avatar-ring-active"
              : agent.status === "SCHEDULED"
                ? "avatar-ring-scheduled"
                : "avatar-ring-idle"
          }`}
        >
          <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden text-sm text-neutral-400 font-medium">
            <img
              src={agent.imageUrl}
              alt={agent.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.textContent =
                  agent.name[0];
              }}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-400 truncate">
              {agent.name}
            </span>
            <span className="text-xs text-neutral-500 shrink-0">
              {timeAgo(item.completedAt)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-neutral-100 mt-0.5">
            {item.title}
          </h3>
          <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
            {item.summary}
          </p>
          <div className="mt-2">
            <Badge label={item.category} />
          </div>
        </div>
      </div>
    </Link>
  );
}
