import { useState } from "react";
import { Link } from "react-router-dom";
import type { Integration } from "../../types";
import type { Skill } from "../../types";
import { Badge } from "../../shared/Badge";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { INTEGRATIONS_QUERY } from "../../queries";
import { SKILLS_QUERY } from "../../queries";

const pills = ["Notifications", "Integrations", "Skills", "Profile"] as const;
type Pill = (typeof pills)[number];

function NotificationsContent() {
  return (
    <div className="flex items-center justify-center px-4 py-20 text-sm text-neutral-500">
      No notifications yet
    </div>
  );
}

function IntegrationsContent() {
  const { data, loading, error } =
    useQuery<{ integrations: Integration[] }>(INTEGRATIONS_QUERY);

  const integrations = data?.integrations ?? [];

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {integrations.map((integration) => (
          <Link
            key={integration.id}
            to={`/integrations/${integration.id}`}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
          >
            <span className="text-3xl">{integration.icon}</span>
            <h3 className="text-sm font-medium text-neutral-100 mt-2">
              {integration.service}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {integration.account}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

function SkillsContent() {
  const [query, setQuery] = useState("");
  const { data, loading, error } =
    useQuery<{ skills: Skill[] }>(SKILLS_QUERY);

  const skills = data?.skills ?? [];
  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 w-full"
        />
      </div>

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-4 pb-4">
        {filtered.map((skill) => (
          <Link
            key={skill.id}
            to={`/skills/${skill.id}`}
            className="bg-neutral-900 rounded-xl p-4 block transition-colors hover:bg-neutral-800/60"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-100">
                {skill.name}
              </h3>
              <Badge label={skill.installed ? "Installed" : "Available"} />
            </div>
            <p className="text-xs text-neutral-400 mb-2">{skill.description}</p>
            <span className="text-[11px] text-neutral-500">
              v{skill.version}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function ProfileContent() {
  return (
    <div className="flex items-center justify-center px-4 py-20 text-sm text-neutral-500">
      Coming soon
    </div>
  );
}

export function UserPage() {
  const [active, setActive] = useState<Pill>("Notifications");

  return (
    <div>
      <PageHeader title="You" />

      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {pills.map((pill) => (
          <button
            key={pill}
            onClick={() => setActive(pill)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === pill
                ? "bg-indigo-500 text-white"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {active === "Notifications" && <NotificationsContent />}
      {active === "Integrations" && <IntegrationsContent />}
      {active === "Skills" && <SkillsContent />}
      {active === "Profile" && <ProfileContent />}
    </div>
  );
}
