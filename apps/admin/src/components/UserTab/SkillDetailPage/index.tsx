import { useState } from "react";
import { useParams } from "react-router-dom";
import { gql } from "../../../auth";
import { INSTALL_SKILL, SKILL_QUERY, UNINSTALL_SKILL } from "../../../queries";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Skill } from "../../../types";
import { useQuery } from "../../../useQuery";

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ skill: Skill | null }>(
    SKILL_QUERY,
    { id },
  );
  const [toggling, setToggling] = useState(false);
  const [localSkill, setLocalSkill] = useState<Skill | null>(null);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const skill = localSkill ?? data?.skill ?? null;

  if (!skill) {
    return <NotFound label="Skill not found." />;
  }

  async function handleToggle() {
    if (!skill) return;
    setToggling(true);
    try {
      if (skill.installed) {
        const result = await gql<{ uninstallSkill: Skill }>(UNINSTALL_SKILL, {
          id,
        });
        setLocalSkill(result.uninstallSkill);
      } else {
        const result = await gql<{ installSkill: Skill }>(INSTALL_SKILL, {
          id,
        });
        setLocalSkill(result.installSkill);
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">
            {skill.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge label={`v${skill.version}`} />
            <Badge label={skill.installed ? "Installed" : "Available"} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Author</span>
          <span className="text-sm text-neutral-100">{skill.author}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Category</span>
          <span className="text-sm text-neutral-100 capitalize">
            {skill.category}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Description</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {skill.description}
          </p>
        </div>

        <button
          type="button"
          disabled={toggling}
          onClick={handleToggle}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            skill.installed
              ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          {toggling
            ? skill.installed
              ? "Uninstalling\u2026"
              : "Installing\u2026"
            : skill.installed
              ? "Uninstall"
              : "Install"}
        </button>
      </div>
    </div>
  );
}
