import { Link } from "react-router-dom";
import type { Agent } from "../../types";
import { Badge } from "../../shared/Badge";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENTS_QUERY } from "../../queries";

export function AgentsPage() {
  const { data, loading, error } =
    useQuery<{ agents: Agent[] }>(AGENTS_QUERY);

  const agents = data?.agents ?? [];

  return (
    <div>
      <PageHeader title="Agents" />

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-4 pb-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-neutral-900 rounded-xl p-4 flex items-start gap-3"
          >
            <Link to={`/agents/${agent.id}`} className="flex-1 min-w-0 flex items-start gap-3">
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
                      (
                        e.target as HTMLImageElement
                      ).parentElement!.textContent = agent.name[0];
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-neutral-100">
                    {agent.name}
                  </h3>
                  <Badge label={agent.status} />
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {agent.soul}
                </p>
              </div>
            </Link>
            <Link
              to={`/agents/${agent.id}/config`}
              className="shrink-0 w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg hover:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M6.86 2.57a1.25 1.25 0 0 1 2.28 0l.4.88a1.25 1.25 0 0 0 1.16.73l.96.02a1.25 1.25 0 0 1 1.14 1.97l-.56.78a1.25 1.25 0 0 0 0 1.38l.56.78a1.25 1.25 0 0 1-1.14 1.97l-.96.02a1.25 1.25 0 0 0-1.16.73l-.4.88a1.25 1.25 0 0 1-2.28 0l-.4-.88a1.25 1.25 0 0 0-1.16-.73l-.96-.02a1.25 1.25 0 0 1-1.14-1.97l.56-.78a1.25 1.25 0 0 0 0-1.38l-.56-.78A1.25 1.25 0 0 1 4.34 4.2l.96-.02a1.25 1.25 0 0 0 1.16-.73l.4-.88ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
