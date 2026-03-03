import { useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "../../../auth";
import { ConnectIntegrationMutation, IntegrationsQuery } from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
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

function IntegrationLogo({ id }: { id: string }) {
  const logo = logoMap[id];
  if (logo) {
    return (
      <div className="h-10 w-10 flex items-center justify-center">
        <img src={logo} alt={id} className="h-10 w-10 object-contain" />
      </div>
    );
  }
  return <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-lg text-neutral-400">{id[0]?.toUpperCase()}</div>;
}

function ChevronRight() {
  return (
    <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
      Not connected
    </span>
  );
}

const categoryLabels: Record<string, string> = {
  productivity: "Productivity",
  communication: "Communication",
  developer: "Developer",
  entertainment: "Entertainment",
  smart_home: "Smart Home",
};

const categoryOrder = ["productivity", "communication", "developer", "entertainment", "smart_home"];

export function IntegrationsPage() {
  const { data, loading, error } = useQuery(IntegrationsQuery);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const integrations = data?.integrations ?? [];

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] ?? cat,
      items: integrations.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    try {
      const result = await gql<{ connectIntegration: string }>(
        ConnectIntegrationMutation,
        { provider: providerId },
      );
      window.location.href = result.connectIntegration;
    } catch (err) {
      console.error(`Failed to start OAuth for ${providerId}:`, err);
      setConnectingId(null);
    }
  }

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="flex flex-col gap-5 px-4 pb-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {group.items.map((integration) =>
                integration.connected ? (
                  <Link
                    key={integration.id}
                    to={`/integrations/${integration.id}`}
                    className="flex flex-col items-center gap-2 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer"
                  >
                    <IntegrationLogo id={integration.id} />
                    <span className="text-sm font-medium text-neutral-100">
                      {integration.service}
                    </span>
                    <StatusBadge connected />
                  </Link>
                ) : (
                  <button
                    key={integration.id}
                    type="button"
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectingId === integration.id}
                    className="flex flex-col items-center gap-2 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 disabled:opacity-50 cursor-pointer disabled:cursor-default"
                  >
                    <div className="opacity-50 group-hover:opacity-75 transition-opacity">
                      <IntegrationLogo id={integration.id} />
                    </div>
                    <span className="text-sm font-medium text-neutral-100">
                      {integration.service}
                    </span>
                    <StatusBadge connected={false} />
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
