import { useParams } from "react-router-dom";
import type { Agent } from "../../types";
import { Badge } from "../../shared/Badge";
import { BackButton } from "../../shared/BackButton";
import { QueryResult, NotFound } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENT_QUERY } from "../../queries";

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-16 h-16 shrink-0 flex items-center justify-center avatar-ring ${
              agent.status === "ACTIVE"
                ? "avatar-ring-active"
                : agent.status === "SCHEDULED"
                  ? "avatar-ring-scheduled"
                  : "avatar-ring-idle"
            }`}
          >
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden text-lg text-neutral-400 font-medium">
              <img
                src={agent.imageUrl}
                alt={agent.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.textContent =
                    agent.name[0];
                }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-100">
              {agent.name}
            </h1>
            <Badge label={agent.status} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Portrait</span>
          <span className="text-sm text-neutral-100 font-mono">
            {agent.portraitId}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Soul</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {agent.soul}
          </p>
        </div>
      </div>
    </div>
  );
}
