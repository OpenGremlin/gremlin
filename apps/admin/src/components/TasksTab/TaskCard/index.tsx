import { Link, useNavigate } from "react-router-dom";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { Badge } from "../../../shared/Badge";
import { timeAgo } from "../../../shared/formatDate";
import type { Task } from "../../../types";

export function TaskCard({ item }: { item: Task }) {
  const { agent } = item;
  const navigate = useNavigate();
  return (
    <Link
      to={`/tasks/${item.id}`}
      className="block px-4 py-4 transition-colors hover:bg-neutral-900/50"
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            navigate(`/agents/${agent.id}`);
          }}
        >
          <AgentAvatar
            src={agent.imageUrl}
            name={agent.name}
            status={agent.status}
            size="sm"
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-neutral-400 truncate">
                {agent.name}
              </span>
              <span className="text-xs text-neutral-600 shrink-0">
                {timeAgo(item.createdAt)}
              </span>
            </div>
            <Badge label={item.status} />
          </div>
          <h3 className="text-sm font-medium text-neutral-100 mt-0.5">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
