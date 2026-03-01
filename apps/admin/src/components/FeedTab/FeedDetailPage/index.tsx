import { Link, useParams } from "react-router-dom";
import { TASK_QUERY } from "../../../queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Task } from "../../../types";
import { useQuery } from "../../../useQuery";
import { LogEntryView } from "../../AgentsTab/AgentChatPage/LogEntryView";

export function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ task: Task | null }>(
    TASK_QUERY,
    { id },
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const item = data?.task ?? null;

  if (!item) {
    return <NotFound label="Task not found." />;
  }

  const { agent } = item;
  const logs = item.logs?.edges.map((e) => e.node) ?? [];

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
              {formatDate(item.createdAt)}
            </p>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-neutral-100 mt-4">
          {item.title}
        </h1>

        <div className="mt-2 flex items-center gap-2">
          <Badge label={item.status} />
          {item.statusReason && (
            <span className="text-xs text-neutral-500">{item.statusReason}</span>
          )}
        </div>

        <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
          {item.updatedAt && (
            <p>Updated: {formatDate(item.updatedAt)}</p>
          )}
          {item.completedAt && (
            <p>Completed: {formatDate(item.completedAt)}</p>
          )}
        </div>

        {logs.length > 0 && (
          <div className="mt-6 space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Conversation
            </h2>
            {logs.map((log) => (
              <LogEntryView key={log.id} entry={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
