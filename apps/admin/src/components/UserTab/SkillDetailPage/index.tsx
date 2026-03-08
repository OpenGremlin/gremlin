import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type {
  BindSkillConnectionMutation as BindMutationType,
  SkillQuery as SkillQueryType,
} from "../../../graphql/generated/graphql";
import {
  BindSkillConnectionMutation,
  SkillQuery,
  UninstallSkillMutation,
} from "../../../graphql/queries";
import { IntegrationConnectionsQuery } from "../../../graphql/queries/integrations";
import { useQuery } from "../../../hooks/useQuery";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { ConnectionPicker } from "../../../shared/ConnectionPicker";
import { NotFound, QueryResult } from "../../../shared/QueryResult";

type Skill = NonNullable<SkillQueryType["skill"]>;

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(SkillQuery, { id: id ?? "" });
  const {
    data: connectionsData,
    loading: connectionsLoading,
    error: connectionsError,
  } = useQuery(IntegrationConnectionsQuery);
  const [uninstalling, setUninstalling] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<
    Record<string, string>
  >({});

  const skill = data?.skill ?? null;
  const connections = connectionsData?.integrationConnections ?? [];

  useEffect(() => {
    if (!skill) return;
    const bound: Record<string, string> = {};
    for (const rc of skill.requiredConnections) {
      if (rc.boundConnectionId) {
        bound[rc.providerId] = rc.boundConnectionId;
      }
    }
    if (Object.keys(bound).length > 0) {
      setSelectedConnections((prev) => ({ ...bound, ...prev }));
    }
  }, [skill]);

  if (loading || error || connectionsLoading || connectionsError) {
    return (
      <QueryResult
        loading={loading || connectionsLoading}
        error={error || connectionsError}
        backButton
      />
    );
  }

  if (!skill) {
    return <NotFound label="Skill not found." />;
  }

  const templateReqs = skill.template.requiredConnections;

  async function handleBindConnection(
    providerId: string,
    connectionId: string,
  ) {
    await gql<BindMutationType>(BindSkillConnectionMutation, {
      id,
      providerId,
      connectionId,
    });
    setSelectedConnections((prev) => ({ ...prev, [providerId]: connectionId }));
  }

  async function handleUninstall() {
    if (!skill) return;
    setUninstalling(true);
    try {
      await gql<{ uninstallSkill: unknown }>(UninstallSkillMutation, { id });
      navigate("/settings/skills");
    } finally {
      setUninstalling(false);
    }
  }

  return (
    <div className="p-6">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">
            {skill.template.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge label={`v${skill.template.version}`} />
            <Badge label="Installed" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Description</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {skill.template.description}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Instance ID</span>
          <p className="text-sm text-neutral-400 font-mono">{skill.id}</p>
        </div>

        {skill.installedAt && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Installed</span>
            <p className="text-sm text-neutral-400">
              {new Date(skill.installedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {templateReqs.length > 0 && (
          <>
            <span className="text-xs text-neutral-500">Connections</span>
            <ConnectionPicker
              requirements={templateReqs}
              connections={connections}
              selected={selectedConnections}
              onSelect={handleBindConnection}
            />
          </>
        )}

        <button
          type="button"
          disabled={uninstalling}
          onClick={handleUninstall}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
        >
          {uninstalling ? "Uninstalling…" : "Uninstall"}
        </button>
      </div>
    </div>
  );
}
