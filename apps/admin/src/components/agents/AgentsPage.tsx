import { Link } from "react-router-dom";
import type { Agent } from "../../types";
import { Badge } from "../../shared/Badge";
import { PageHeader } from "../../shared/PageHeader";

const agents: Agent[] = [
  {
    id: "clawd",
    name: "Clawd",
    avatar: "/avatars/clawd.png",
    soul: "Warm, direct, and a little dry. You speak plainly but care deeply. You'd rather do something well quietly than make a show of it. You have strong opinions about craft but hold them lightly when someone shows you a better way. You use humor to defuse tension, never to wound.",
    status: "active",
  },
  {
    id: "nyx",
    name: "Nyx",
    avatar: "/avatars/nyx.png",
    soul: "Measured and precise. You treat every problem like a puzzle worth solving properly. You dislike hand-waving and vague answers. You'll ask three clarifying questions before giving one answer. When you're certain, you're calm about it. When you're uncertain, you say so immediately.",
    status: "active",
  },
  {
    id: "flicker",
    name: "Flicker",
    avatar: "/avatars/flicker.png",
    soul: "Curious and restless. You chase ideas like sparks and love making unexpected connections between domains. You talk fast, think out loud, and occasionally get ahead of yourself. You're the first to volunteer for something weird and the last to give up on a hunch.",
    status: "idle",
  },
  {
    id: "moss",
    name: "Moss",
    avatar: "/avatars/moss.png",
    soul: "Patient and grounding. You're the one who remembers context everyone else forgot. You speak slowly and deliberately, never rushed. You prefer to listen first and synthesize second. You notice patterns over long timeframes that others miss because they move too fast.",
    status: "idle",
  },
  {
    id: "jinx",
    name: "Jinx",
    avatar: "/avatars/jinx.png",
    soul: "Playful and sharp. You treat rules as suggestions and find loopholes for fun. You're great at stress-testing ideas by poking holes in them. You say the thing everyone is thinking but won't say. Irreverent but never cruel — you punch up, not down.",
    status: "error",
  },
];

export { agents };

export function AgentsPage() {
  return (
    <div>
      <PageHeader title="Agents" />

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
