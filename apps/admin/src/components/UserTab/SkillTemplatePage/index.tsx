import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type { BindSkillConnectionMutation as BindMutationType } from "../../../graphql/generated/graphql";
import {
  BindSkillConnectionMutation,
  InstallSkillMutation,
  SkillsQuery,
  SkillTemplateQuery,
} from "../../../graphql/queries";
import { IntegrationConnectionsQuery } from "../../../graphql/queries/integrations";
import { useQuery } from "../../../hooks/useQuery";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { ConnectionPicker } from "../../../shared/ConnectionPicker";
import { NotFound, QueryResult } from "../../../shared/QueryResult";

export function SkillTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    id: templateId ?? "",
  });
  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(SkillsQuery);
  const {
    data: connectionsData,
    loading: connectionsLoading,
    error: connectionsError,
  } = useQuery(IntegrationConnectionsQuery);

  const [installing, setInstalling] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<
    Record<string, string>
  >({});

  const template = data?.skillTemplate ?? null;
  const connections = connectionsData?.integrationConnections ?? [];
  const instances = (skillsData?.skills ?? []).filter(
    (s) => s.template.id === templateId,
  );

  const anyLoading = loading || skillsLoading || connectionsLoading;
  const anyError = error || skillsError || connectionsError;

  if (anyLoading || anyError) {
    return <QueryResult loading={anyLoading} error={anyError} backButton />;
  }

  if (!template) {
    return <NotFound label="Skill template not found." />;
  }

  const templateReqs = template.requiredConnections;
  const requiredProviderIds = templateReqs
    .filter((r) => !r.optional)
    .map((r) => r.providerId);
  const allRequiredSelected = requiredProviderIds.every(
    (pid) => selectedConnections[pid],
  );
  const installDisabled =
    installing || (templateReqs.length > 0 && !allRequiredSelected);

  function selectConnection(providerId: string, connectionId: string) {
    setSelectedConnections((prev) => ({ ...prev, [providerId]: connectionId }));
  }

  async function handleInstall() {
    setInstalling(true);
    try {
      const result = await gql<{ installSkill: { id: string } }>(
        InstallSkillMutation,
        { templateId },
      );

      for (const [providerId, connectionId] of Object.entries(
        selectedConnections,
      )) {
        await gql<BindMutationType>(BindSkillConnectionMutation, {
          id: result.installSkill.id,
          providerId,
          connectionId,
        });
      }

      navigate(`/settings/skills/${result.installSkill.id}`);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="p-6">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">
            {template.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge label={`v${template.version}`} />
            <Badge label={template.category} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Description</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Existing instances */}
        {instances.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-neutral-500">
              Installed Instances ({instances.length})
            </span>
            {instances.map((inst) => (
              <Link
                key={inst.id}
                to={`/settings/skills/${inst.id}`}
                className="flex items-center gap-3 bg-neutral-900 rounded-xl p-3 transition-colors hover:bg-neutral-800/80"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-100 truncate">
                    {inst.template.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {inst.id.slice(0, 8)}…
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <CircleCheck size={12} /> Installed
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Connection picker for new install */}
        {templateReqs.length > 0 && (
          <>
            <span className="text-xs text-neutral-500">
              Select connections for new instance
            </span>
            <ConnectionPicker
              requirements={templateReqs}
              connections={connections}
              selected={selectedConnections}
              onSelect={selectConnection}
            />
          </>
        )}

        <button
          type="button"
          disabled={installDisabled}
          onClick={handleInstall}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-500"
        >
          {installing ? "Installing…" : "Install"}
        </button>
      </div>
    </div>
  );
}
