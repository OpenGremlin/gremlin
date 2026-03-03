import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  IntegrationConnectionsQuery,
  RenameConnectionMutation,
  RevokeConnectionMutation,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
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

export function ConnectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    IntegrationConnectionsQuery,
  );
  const [revoking, setRevoking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const connection =
    data?.integrationConnections.find((c) => c.id === id) ?? null;

  if (!connection) {
    return <NotFound label="Connection not found." />;
  }

  const meta = connection.meta;
  const accountId = meta.accountId ?? null;
  const scopes =
    meta.__typename === "OAuthConnectionMeta" ? meta.scopes : null;
  const description = connection.description;

  function startEditing() {
    setEditValue(description);
    setEditing(true);
  }

  async function handleRename() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === description) {
      setEditing(false);
      return;
    }
    await gql<{ renameIntegrationConnection: boolean }>(
      RenameConnectionMutation,
      { id, description: trimmed },
    );
    setEditing(false);
    refetch();
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      await gql<{ revokeIntegrationConnection: boolean }>(
        RevokeConnectionMutation,
        { id },
      );
      navigate("/user/integrations");
    } catch {
      setRevoking(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <div className="flex items-center justify-between">
        <BackButton to="/user/integrations" />
        <button
          type="button"
          onClick={handleRevoke}
          disabled={revoking}
          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {revoking ? "Revoking..." : "Revoke"}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={connection.providerId} />
        <div>
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRename()}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="text-xl font-semibold text-neutral-100 bg-transparent border-b border-neutral-600 outline-none w-full"
            />
          ) : (
            <h1
              onClick={startEditing}
              className="text-xl font-semibold text-neutral-100 cursor-pointer hover:text-neutral-300 transition-colors"
            >
              {connection.description}
            </h1>
          )}
          {accountId && (
            <p className="text-sm text-neutral-400 mt-0.5">{accountId}</p>
          )}
          <p className="text-xs text-neutral-500 mt-0.5">
            Connected {formatDate(connection.connectedAt)}
          </p>
        </div>
      </div>

      {scopes && scopes.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-medium text-neutral-100 mb-3">
            Granted Scopes
          </h2>
          <div className="flex flex-col gap-2">
            {scopes.map((scope) => (
              <div
                key={scope}
                className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 text-left"
              >
                <span className="text-sm text-neutral-100">{scope}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h2 className="text-sm font-medium text-neutral-100 mb-3">Details</h2>
        <div className="bg-neutral-900 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Provider</span>
            <span className="text-neutral-100">{connection.providerId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Type</span>
            <span className="text-neutral-100">{connection.connectionType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
