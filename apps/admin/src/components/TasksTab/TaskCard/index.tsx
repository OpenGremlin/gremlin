import { CheckCircle, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TASK_UPDATED_SUBSCRIPTION } from "../../../queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { Badge } from "../../../shared/Badge";
import { DocumentCard } from "../../../shared/DocumentCard";
import { timeAgo } from "../../../shared/formatDate";
import type { Task } from "../../../types";
import { useSubscription } from "../../../useSubscription";

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "WAITING"]);

export function TaskCard({ item }: { item: Task }) {
  const [override, setOverride] = useState<Partial<Task>>({});
  const task = { ...item, ...override };
  const { agent } = task;
  const navigate = useNavigate();

  useSubscription<{ taskUpdated: Partial<Task> & { id: string } }>(
    TASK_UPDATED_SUBSCRIPTION,
    { taskId: item.id },
    useCallback((data) => {
      setOverride((prev) => ({ ...prev, ...data.taskUpdated }));
    }, []),
  );
  return (
    <Link
      to={`/tasks/${task.id}`}
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
                {timeAgo(task.createdAt)}
              </span>
            </div>
            <Badge label={task.status} />
          </div>
          <h3 className="text-sm font-medium text-neutral-100 mt-0.5">
            {task.title}
          </h3>
          {task.message && (
            <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
              {ACTIVE_STATUSES.has(task.status) ? (
                <Loader2 size={12} className="animate-spin shrink-0 text-blue-400" />
              ) : task.status === "COMPLETED" ? (
                <CheckCircle size={12} className="shrink-0 text-green-500" />
              ) : null}
              <span className="truncate">{task.message}</span>
            </div>
          )}
          {task.documents.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5" onClick={(e) => e.preventDefault()}>
              {task.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
