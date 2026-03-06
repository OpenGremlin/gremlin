import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as logos from "../../../assets/logos";
import { gql } from "../../../auth";
import type {
  BindSkillConnectionMutation as BindMutationType,
  IntegrationConnectionsQuery as ConnectionsQueryType,
} from "../../../graphql/generated/graphql";
import {
  BindSkillConnectionMutation,
  InstallSkillMutation,
  SkillsQuery,
  SkillTemplateQuery,
} from "../../../graphql/queries";
import { IntegrationConnectionsQuery } from "../../../graphql/queries/integrations";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

type Connection = ConnectionsQueryType["integrationConnections"][number];

const logoMap: Record<string, string> = {
  google: logos.googleLogo,
  notion: logos.notionLogo,
  linear: logos.linearLogo,
  trello: logos.trelloLogo,
  slack: logos.slackLogo,
  discord: logos.discordLogo,
  teams: logos.teamsLogo,
  telegram: logos.telegramLogo,
  whatsapp: logos.whatsappLogo,
  github: logos.githubLogo,
  gitlab: logos.gitlabLogo,
  jira: logos.jiraLogo,
  spotify: logos.spotifyLogo,
  hue: logos.hueLogo,
  homeassistant: logos.homeAssistantLogo,
  anthropic: logos.anthropicLogo,
  openai: logos.openaiLogo,
  google_ai: logos.geminiLogo,
  mistral: logos.mistralLogo,
  deepseek: logos.deepseekLogo,
  xai: logos.xaiLogo,
  bedrock: logos.bedrockLogo,
  brave: logos.braveLogo,
};

function ProviderLogo({ id }: { id: string }) {
  const logo = logoMap[id];
  if (logo) {
    return (
      <div className="h-8 w-8 flex items-center justify-center">
        <img src={logo} alt={id} className="h-8 w-8 object-contain" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm text-neutral-400">
      {id[0]?.toUpperCase()}
    </div>
  );
}

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
    return (
      <QueryResult
        loading={anyLoading}
        error={anyError}
        backButton
      />
    );
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

  function connectionsByProvider(providerId: string): Connection[] {
    return connections.filter(
      (c) => c.providerId === providerId && !c.isRevoked,
    );
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
          <div className="flex flex-col gap-3">
            <span className="text-xs text-neutral-500">
              Select connections for new instance
            </span>
            {templateReqs.map((req) => {
              const available = connectionsByProvider(req.providerId);
              const selected = selectedConnections[req.providerId];
              return (
                <div key={req.providerId} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-100">
                      {req.providerName}
                    </span>
                    {req.optional && (
                      <span className="text-xs text-neutral-500">
                        (optional)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">{req.reason}</p>
                  {available.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {available.map((conn) => (
                        <button
                          key={conn.id}
                          type="button"
                          onClick={() =>
                            selectConnection(req.providerId, conn.id)
                          }
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                            selected === conn.id
                              ? "border-emerald-500 ring-2 ring-emerald-500 bg-neutral-800/50"
                              : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
                          }`}
                        >
                          <ProviderLogo id={req.providerId} />
                          <span className="text-sm text-neutral-200">
                            {conn.description || conn.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      No {req.providerName} connections.{" "}
                      <Link
                        to={`/settings/integrations/${req.providerId}`}
                        className="text-indigo-400 hover:underline"
                      >
                        Set up a connection
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
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
