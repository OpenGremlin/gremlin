import { CheckCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { Badge } from "../../../shared/Badge";
import { DocumentCard } from "../../../shared/DocumentCard";
import { timeAgo } from "../../../shared/formatDate";
import type { Task } from "../../../types";

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "WAITING"]);

export function TaskCard({ item }: { item: Task }) {
  const { agent } = item;
  const navigate = useNavigate();
  return (
    <Link
      to={`/tasks/${item.id}`}
      className="block px-4 py-4 transition-colors hover:bg-neutral-900/50"
    >
      <div className="flex items-start gap-3">
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
          {item.message && (
            <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
              {ACTIVE_STATUSES.has(item.status) ? (
                <Loader2 size={12} className="animate-spin shrink-0 text-blue-400" />
              ) : item.status === "COMPLETED" ? (
                <CheckCircle size={12} className="shrink-0 text-green-500" />
              ) : null}
              <span className="truncate">{item.message}</span>
            </div>
          )}
          {item.documents.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5" onClick={(e) => e.preventDefault()}>
              {item.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
