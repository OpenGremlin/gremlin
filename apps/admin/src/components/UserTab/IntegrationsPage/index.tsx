import { Link } from "react-router-dom";
import {
  IntegrationConnectionsQuery,
  IntegrationProvidersQuery,
} from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
import { formatDate } from "../../../shared/formatDate";
import { useQuery } from "../../../useQuery";

import googleLogo from "../../../assets/logos/Google.svg";
import notionLogo from "../../../assets/logos/Notion.svg";
import linearLogo from "../../../assets/logos/Linear.svg";
import trelloLogo from "../../../assets/logos/Trello.svg";
import slackLogo from "../../../assets/logos/Slack.svg";
import discordLogo from "../../../assets/logos/Discord.svg";
import teamsLogo from "../../../assets/logos/Teams.svg";
import telegramLogo from "../../../assets/logos/Telegram.svg";
import whatsappLogo from "../../../assets/logos/WhatsApp.svg";
import githubLogo from "../../../assets/logos/GitHub.svg";
import gitlabLogo from "../../../assets/logos/GitLab.svg";
import jiraLogo from "../../../assets/logos/Jira.svg";
import spotifyLogo from "../../../assets/logos/Spotify.svg";
import hueLogo from "../../../assets/logos/Hue.svg";
import homeAssistantLogo from "../../../assets/logos/HomeAssistant.svg";

const logoMap: Record<string, string> = {
  google: googleLogo,
  notion: notionLogo,
  linear: linearLogo,
  trello: trelloLogo,
  slack: slackLogo,
  discord: discordLogo,
  teams: teamsLogo,
  telegram: telegramLogo,
  whatsapp: whatsappLogo,
  github: githubLogo,
  gitlab: gitlabLogo,
  jira: jiraLogo,
  spotify: spotifyLogo,
  hue: hueLogo,
  homeassistant: homeAssistantLogo,
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
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
        Not connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {count} {count === 1 ? "connection" : "connections"}
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
  productivity: "Productivity",
  communication: "Communication",
  developer: "Developer",
  entertainment: "Entertainment",
  smart_home: "Smart Home",
};

const categoryOrder = [
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
  const connectionList = connections.data?.integrationConnections ?? [];

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] ?? cat,
      items: providerList.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="flex flex-col gap-5 px-4 pb-6">
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
                  to={`/connections/${conn.id}`}
                  className="flex items-center gap-3 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800"
                >
                  <IntegrationLogo id={conn.providerId} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">
                      {conn.description}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {getAccountId(conn.meta) ?? conn.providerId}
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

        {/* Provider catalog grouped by category */}
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {group.items.map((provider) => (
                <Link
                  key={provider.id}
                  to={`/integrations/${provider.id}`}
                  className="flex flex-col items-center gap-2 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer"
                >
                  <IntegrationLogo id={provider.id} />
                  <span className="text-sm font-medium text-neutral-100">
                    {provider.service}
                  </span>
                  <ConnectionCountBadge count={provider.connectionCount} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
