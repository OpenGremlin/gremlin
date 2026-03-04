import { Link } from "react-router-dom";
import type { AgentQuery } from "../../../../graphql/generated/graphql";
import { AgentAvatar } from "../../../../shared/AgentAvatar";

type Agent = NonNullable<AgentQuery["agent"]>;

export function ChatHeader({ agent }: { agent: Agent }) {
  return (
    <div className="pt-4 pb-3 flex flex-col items-center border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm shrink-0">
      <Link to={`/agents/${agent.id}/config`}>
        <AgentAvatar id={agent.id} size={64} />
      </Link>
      <h1 className="text-sm font-semibold text-neutral-100 mt-2">
        {agent.name}
      </h1>
      {agent.statusReason && (
        <p className="text-xs text-red-400/80 mt-1">{agent.statusReason}</p>
      )}
    </div>
  );
}
