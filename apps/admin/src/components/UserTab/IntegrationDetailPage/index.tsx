import { useState } from "react";
import { useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  ConnectIntegrationMutation,
  IntegrationProvidersQuery,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
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
      <div className="h-12 w-12 flex items-center justify-center">
        <img src={logo} alt={id} className="h-12 w-12 object-contain" />
      </div>
    );
  }
  return (
    <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl text-neutral-400">
      {id[0]?.toUpperCase()}
    </div>
  );
}

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(IntegrationProvidersQuery);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;

  if (!provider) {
    return <NotFound label="Integration not found." />;
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  function selectAll() {
    setSelectedScopes(new Set(provider!.availableScopes.map((s) => s.scope)));
  }

  async function handleConnect() {
    if (selectedScopes.size === 0) return;
    setConnecting(true);
    try {
      const result = await gql<{ connectIntegration: string }>(
        ConnectIntegrationMutation,
        { providerId: id, scopes: Array.from(selectedScopes) },
      );
      window.location.href = result.connectIntegration;
    } catch {
      setConnecting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <BackButton />

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={provider.id} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {provider.service}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {provider.description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-100">
            Select Permissions
          </h2>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Select all
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {provider.availableScopes.map((scope) => (
            <button
              key={scope.scope}
              type="button"
              onClick={() => toggleScope(scope.scope)}
              className="flex items-center gap-3 bg-neutral-900 rounded-xl p-4 text-left transition-colors hover:bg-neutral-800/80 active:bg-neutral-800"
            >
              <div
                className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedScopes.has(scope.scope)
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-neutral-600"
                }`}
              >
                {selectedScopes.has(scope.scope) && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-neutral-100">{scope.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting || selectedScopes.size === 0}
        className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl p-4 transition-colors disabled:opacity-50"
      >
        {connecting
          ? "Connecting..."
          : `Connect ${provider.service}${selectedScopes.size > 0 ? ` (${selectedScopes.size} ${selectedScopes.size === 1 ? "permission" : "permissions"})` : ""}`}
      </button>
    </div>
  );
}
