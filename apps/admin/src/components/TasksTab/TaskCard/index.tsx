import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { DocumentCard } from "../../../shared/DocumentCard";
import { timeAgo } from "../../../shared/formatDate";
import { useTaskUpdates } from "../../../subscriptions";

/** Minimal task shape accepted by TaskCard (AgentJobQuery tasks lack some fields) */
type TaskItem = {
  id: string;
  title: string;
  createdAt: string;
  agent: { id: string; name?: string };
  message?: string | null;
  imageUrl?: string | null;
  documents?: Array<{
    path: string;
    title: string;
    body?: string | null;
  }>;
};

export function TaskCard({ item }: { item: TaskItem }) {
  const [override, setOverride] = useState<Partial<TaskItem>>({});
  const task = { ...item, ...override };
  const { agent } = task;
  const navigate = useNavigate();

  useTaskUpdates(
    item.id,
    useCallback((data) => {
      setOverride((prev) => ({ ...prev, ...data }) as Partial<TaskItem>);
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
          <AgentAvatar id={agent.id} />
        </button>
        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {agent.name && (
                <span className="text-sm text-neutral-400 truncate">
                  {agent.name}
                </span>
              )}
              <span className="text-xs text-neutral-600 shrink-0">
                {timeAgo(task.createdAt)}
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-neutral-100 mt-0.5">
            {task.title}
          </h3>
          {task.message && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {task.message}
            </p>
          )}
          {task.documents && task.documents.length > 0 && (
            // biome-ignore lint/a11y/noStaticElementInteractions: presentation role prevents parent link navigation
            <div
              role="presentation"
              className="mt-2 flex flex-col gap-1.5"
              onClick={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            >
              {task.documents.map((doc) => (
                <DocumentCard key={doc.path} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
