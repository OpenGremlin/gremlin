import { Link, useParams } from "react-router-dom";
import { TaskLogsQuery, TaskQuery } from "../../../graphql/queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { usePaginatedQuery } from "../../../usePaginatedQuery";
import { useQuery } from "../../../useQuery";
import { LogEntryView } from "../../AgentsTab/AgentChatPage/LogEntryView";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(TaskQuery, { id: id ?? "" });
  const {
    nodes: logs,
    loading: logsLoading,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedQuery(TaskLogsQuery, (d) => d.taskLogs, {
    taskId: id ?? "",
  });

  if ((loading && logsLoading) || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const item = data?.task ?? null;

  if (!item) {
    return <NotFound label="Task not found." />;
  }

  const { agent } = item;

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="px-4 pt-4 pb-24">
        <BackButton />

        <div className="flex items-center gap-3 mt-6">
          <Link to={`/agents/${agent.id}`}>
            <AgentAvatar id={agent.id} />
          </Link>
          <div>
            <span className="text-sm font-medium text-neutral-100">Task</span>
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
          {item.message && (
            <span className="text-xs text-neutral-500">{item.message}</span>
          )}
        </div>

        <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
          {item.updatedAt && <p>Updated: {formatDate(item.updatedAt)}</p>}
          {item.completedAt && <p>Completed: {formatDate(item.completedAt)}</p>}
        </div>

        {logs.length > 0 && (
          <div className="mt-6 space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Conversation
            </h2>
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mb-2 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-1"
              >
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            )}
            {logs.map((log) => (
              <LogEntryView key={log.id} entry={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
