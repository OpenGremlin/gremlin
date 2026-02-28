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
          <Link
            key={agent.id}
            to={`/agents/${agent.id}`}
            className="bg-neutral-900 rounded-xl p-4 block transition-colors hover:bg-neutral-800/60"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={agent.avatar}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-neutral-100">
                    {agent.name}
                  </h3>
                  <Badge label={agent.status} />
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {agent.soul}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
