import { useState } from "react";
import type { AgentStatus } from "../graphql/generated/graphql";
import { AgentQuery, AgentUpdatedSubscription } from "../graphql/queries";
import { useQuery } from "../useQuery";
import { useSubscription } from "../useSubscription";

type Size = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<Size, { container: string; text: string }> = {
  xs: { container: "w-8 h-8", text: "text-[10px]" },
  sm: { container: "w-9 h-9", text: "text-xs" },
  md: { container: "w-12 h-12", text: "text-sm" },
  lg: { container: "w-16 h-16", text: "text-lg" },
};

export function AgentAvatar({ id, size = "md" }: { id: string; size?: Size }) {
  const { data } = useQuery(AgentQuery, { id });
  const agent = data?.agent;
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useSubscription(AgentUpdatedSubscription, { agentId: id }, (update) =>
    setStatus(update.agentUpdated.status),
  );

  const effectiveStatus = status ?? agent?.status ?? "IDLE";

  const s = sizeClasses[size];

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
      className={`${s.container} shrink-0 flex items-center justify-center ${ringClass}`}
    >
      <div
        className={`w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden ${s.text} text-neutral-400 font-medium`}
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
