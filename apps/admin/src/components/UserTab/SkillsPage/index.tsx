import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SkillsQuery, SkillTemplatesQuery } from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { groupByCategory } from "../../../shared/categories";
import { IntegrationLogo } from "../../../shared/IntegrationLogo";
import { QueryResult } from "../../../shared/QueryResult";

function InstallCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs text-neutral-500">Connect</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <CircleCheck size={12} /> {count} installed
    </span>
  );
}

export function SkillsPage() {
  const [query, setQuery] = useState("");
  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(SkillsQuery);
  const {
    data: templatesData,
    loading: templatesLoading,
    error: templatesError,
  } = useQuery(SkillTemplatesQuery);

  const loading = skillsLoading || templatesLoading;
  const error = skillsError || templatesError;
  const installedSkills = skillsData?.skills ?? [];
  const templates = templatesData?.skillTemplates ?? [];

  const q = query.toLowerCase();
  const filteredInstalled = installedSkills.filter((s) =>
    s.template.name.toLowerCase().includes(q),
  );
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(q),
  );

  const grouped = groupByCategory(filteredTemplates);

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

      <div className="flex flex-col gap-5">
        {/* Installed Skills */}
        {filteredInstalled.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Installed Skills
            </h3>
            <div className="flex flex-col gap-2">
              {filteredInstalled.map((skill) => (
                <Link
                  key={skill.id}
                  to={`/settings/skills/${skill.id}`}
                  className="flex items-center gap-3 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800"
                >
                  <IntegrationLogo id={skill.template.icon ?? ""} size={10} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">
                      {skill.template.name}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {skill.template.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                    <CircleCheck size={12} /> Installed
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredInstalled.length > 0 && <hr className="border-neutral-800" />}

        {/* Skill Catalog grouped by category */}
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {group.items.map((template) => (
                <Link
                  key={template.id}
                  to={`/settings/skills/catalog/${template.id}`}
                  className={`flex flex-col items-center gap-2 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer ${
                    template.installCount > 0
                      ? "ring-1 ring-emerald-500/40"
                      : ""
                  }`}
                >
                  <IntegrationLogo id={template.icon ?? ""} size={10} />
                  <span className="text-sm font-medium text-neutral-100">
                    {template.name}
                  </span>
                  <InstallCountBadge count={template.installCount} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
