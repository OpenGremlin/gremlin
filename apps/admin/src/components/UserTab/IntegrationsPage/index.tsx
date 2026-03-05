import { CircleCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import * as logos from "../../../assets/logos";
import {
  IntegrationConnectionsQuery,
  IntegrationProvidersQuery,
} from "../../../graphql/queries";
import { formatDate } from "../../../shared/formatDate";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

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

function IntegrationLogo({ id, size = 10 }: { id: string; size?: number }) {
  const logo = logoMap[id];
  const cls = `h-${size} w-${size}`;
  if (logo) {
    return (
      <div className={`${cls} flex items-center justify-center`}>
        <img src={logo} alt={id} className={`${cls} object-contain`} />
      </div>
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-neutral-800 flex items-center justify-center text-lg text-neutral-400`}
    >
      {id[0]?.toUpperCase()}
    </div>
  );
}

function ConnectionCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs text-neutral-500">Connect</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <CircleCheck size={12} /> {count}
    </span>
  );
}

function getAccountId(
  meta:
    | { __typename?: "OAuthConnectionMeta"; accountId?: string | null }
    | { __typename?: "ApiKeyConnectionMeta"; accountId?: string | null },
): string | null {
  return meta.accountId ?? null;
}

const categoryLabels: Record<string, string> = {
  ai: "AI Models",
  web: "Web",
  productivity: "Productivity",
  communication: "Communication",
  developer: "Developer",
  entertainment: "Entertainment",
  smart_home: "Smart Home",
};

const categoryOrder = [
  "ai",
  "web",
  "productivity",
  "communication",
  "developer",
  "entertainment",
  "smart_home",
];

export function IntegrationsPage() {
  const providers = useQuery(IntegrationProvidersQuery);
  const connections = useQuery(IntegrationConnectionsQuery);

  const loading = providers.loading || connections.loading;
  const error = providers.error || connections.error;

  const providerList = providers.data?.integrationProviders ?? [];
  const defaultModel = providers.data?.defaultModel ?? null;
  const connectionList = connections.data?.integrationConnections ?? [];

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] ?? cat,
      items: providerList.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="p-6">
      <QueryResult loading={loading} error={error} />
      <div className="flex flex-col gap-5">
        {/* Default Model Summary */}
        {!loading && defaultModel && (
          <div className="bg-neutral-900 rounded-xl p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Default Model
            </p>
            <p className="text-sm font-medium text-neutral-100">
              {providerList
                .find((p) => p.id === defaultModel.providerId)
                ?.models?.find((m) => m.id === defaultModel.modelId)?.name ??
                defaultModel.modelId}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {providerList.find((p) => p.id === defaultModel.providerId)
                ?.service ?? defaultModel.providerId}
            </p>
          </div>
        )}
        {!loading &&
          !defaultModel &&
          providerList.some((p) => p.category === "ai") && (
            <div className="bg-neutral-900 rounded-xl p-4 text-sm text-neutral-400">
              No default model selected. Using Bedrock Claude Sonnet 4.
              Configure a provider below to use your own API key.
            </div>
          )}

        {/* Active Connections */}
        {connectionList.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Connections
            </h3>
            <div className="flex flex-col gap-2">
              {connectionList.map((conn) => (
                <Link
                  key={conn.id}
                  to={`/settings/connections/${conn.id}`}
                  className="flex items-center gap-3 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800"
                >
                  <IntegrationLogo id={conn.providerId} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">
                      {conn.description}
                    </p>
                    <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5">
                      {getAccountId(conn.meta) ?? conn.providerId}
                      <Lock size={10} className="shrink-0 text-neutral-500" />
                      <span className="text-neutral-500">
                        {conn.connectionType === "oauth"
                          ? "OAuth"
                          : conn.connectionType === "apikey"
                            ? "API Key"
                            : conn.connectionType}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">
                    {formatDate(conn.connectedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {connectionList.length > 0 && <hr className="border-neutral-800" />}

        {/* Provider catalog grouped by category */}
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {group.items.map((provider) => {
                const connected =
                  provider.connectionType === "bedrock" ||
                  provider.connectionCount > 0;
                return (
                  <Link
                    key={provider.id}
                    to={`/settings/integrations/${provider.id}`}
                    className={`flex flex-col items-center gap-2 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer ${connected ? "ring-1 ring-emerald-500/40" : ""}`}
                  >
                    <IntegrationLogo id={provider.id} />
                    <span className="text-sm font-medium text-neutral-100">
                      {provider.service}
                    </span>
                    {provider.connectionType === "bedrock" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CircleCheck size={12} /> Connected
                      </span>
                    ) : (
                      <ConnectionCountBadge count={provider.connectionCount} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
