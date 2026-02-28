import { useParams } from "react-router-dom";
import { Badge } from "../../shared/Badge";
import { BackButton } from "../../shared/BackButton";
import { agents } from "./AgentsPage";

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agent = agents.find((a) => a.id === id);

  if (!agent) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-400 mt-4">Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center overflow-hidden text-lg text-neutral-400 font-medium">
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.textContent =
                  agent.name[0];
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-100">
              {agent.name}
            </h1>
            <Badge label={agent.status} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Avatar</span>
          <span className="text-sm text-neutral-100 font-mono">
            {agent.avatar}
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
