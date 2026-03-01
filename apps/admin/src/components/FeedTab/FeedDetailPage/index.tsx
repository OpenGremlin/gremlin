import Markdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { STATUS_QUERY } from "../../../queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Status } from "../../../types";
import { useQuery } from "../../../useQuery";

export function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ status: Status | null }>(
    STATUS_QUERY,
    { id },
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const item = data?.status ?? null;

  if (!item) {
    return <NotFound label="Status not found." />;
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

        <div className="mt-6 space-y-4">
          {item.artifacts.map((artifact, i) => (
            <div
              key={i}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-neutral-200 mb-3">
                {artifact.title}
              </h2>
              <div className="text-sm text-neutral-300 leading-relaxed document-body">
                <Markdown>{artifact.body}</Markdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
