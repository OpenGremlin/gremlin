import { useState } from "react";
import { Link } from "react-router-dom";
import { SkillsQuery } from "../../../graphql/queries";
import { Badge } from "../../../shared/Badge";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

export function SkillsPage() {
  const [query, setQuery] = useState("");
  const { data, loading, error } = useQuery(SkillsQuery);

  const skills = data?.skills ?? [];
  const q = query.toLowerCase();
  const filtered = skills.filter((s) => s.name.toLowerCase().includes(q));

  return (
    <div className="p-6">
      <div className="pb-3">
        <input
          type="text"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 w-full"
        />
      </div>

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3">
        {filtered.map((skill) => (
          <Link
            key={skill.id}
            to={`/settings/skills/${skill.id}`}
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
    </div>
  );
}
