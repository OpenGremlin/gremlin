import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import type { Agent } from "../../types";
import { AgentAvatar } from "../../shared/AgentAvatar";
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
              <AgentAvatar src={agent.imageUrl} name={agent.name} status={agent.status} size="md" />
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
              <Settings size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
