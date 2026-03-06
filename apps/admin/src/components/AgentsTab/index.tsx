import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AgentsQuery } from "../../graphql/queries";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AgentCard } from "./AgentCard";

export function AgentsTab() {
  const { data, loading, error } = useQuery(AgentsQuery);
  const [showRetired, setShowRetired] = useState(false);

  const allAgents = data?.agents ?? [];
  const activeAgents = allAgents.filter((a) => !a.retired);
  const retiredAgents = allAgents.filter((a) => a.retired);

  return (
    <div>
      <PageHeader title="Agents" />

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-6 pb-6">
        {activeAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}

        <Link
          to="/agents/new"
          className="self-start flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <Plus size={14} />
          New Agent
        </Link>

        {retiredAgents.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowRetired((v) => !v)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors self-start"
            >
              {showRetired ? "Hide retired agents" : `Show retired agents (${retiredAgents.length})`}
            </button>

            {showRetired &&
              retiredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
