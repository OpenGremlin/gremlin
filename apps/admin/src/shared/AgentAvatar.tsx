import { useState } from "react";
import type { AgentStatus } from "../graphql/generated/graphql";
import { AgentQuery } from "../graphql/queries";
import { useAgentUpdates } from "../subscriptions";
import { useQuery } from "../useQuery";

export function AgentAvatar({
  id,
  size = 48,
}: { id: string; size?: number }) {
  const { data } = useQuery(AgentQuery, { id });
  const agent = data?.agent;
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useAgentUpdates(id, (update) =>
    setStatus((update as { status: AgentStatus }).status),
  );

  const effectiveStatus = status ?? agent?.status ?? "IDLE";

  const ringClass = `avatar-ring ${
    effectiveStatus === "ACTIVE"
      ? "avatar-ring-active"
      : effectiveStatus === "SCHEDULED"
        ? "avatar-ring-scheduled"
        : effectiveStatus === "BLOCKED"
          ? "avatar-ring-blocked"
          : "avatar-ring-idle"
  }`;

  const name = agent?.name ?? "";

  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 flex items-center justify-center ${ringClass}`}
    >
      <div
        className={`w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden text-sm text-neutral-400 font-medium`}
      >
        {agent?.imageUrl && (
          <img
            src={agent.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.textContent = name[0];
            }}
          />
        )}
      </div>
    </div>
  );
}
