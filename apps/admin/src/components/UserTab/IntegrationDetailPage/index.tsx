import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  ConnectIntegrationMutation,
  DisconnectIntegrationMutation,
  IntegrationQuery,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

import googleLogo from "../../../assets/logos/Google.svg";
import slackLogo from "../../../assets/logos/Slack.svg";
import githubLogo from "../../../assets/logos/GitHub.svg";
import spotifyLogo from "../../../assets/logos/Spotify.svg";

const logoMap: Record<string, string> = {
  google: googleLogo,
  slack: slackLogo,
  github: githubLogo,
  spotify: spotifyLogo,
};

function IntegrationLogo({ id }: { id: string }) {
  const logo = logoMap[id];
  if (logo) {
    return <img src={logo} alt={id} className="h-16 w-16 transition-opacity" />;
  }
  return <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl text-neutral-400">{id[0]?.toUpperCase()}</div>;
}

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(IntegrationQuery, { id: id! });
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const integration = data?.integration ?? null;

  if (!integration) {
    return <NotFound label="Integration not found." />;
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await gql<{ disconnectIntegration: boolean }>(
        DisconnectIntegrationMutation,
        { id },
      );
      navigate("/user/integrations");
    } catch {
      setDisconnecting(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const result = await gql<{ connectIntegration: string }>(
        ConnectIntegrationMutation,
        { provider: id },
      );
      window.location.href = result.connectIntegration;
    } catch {
      setConnecting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <div className="flex items-center justify-between">
        <BackButton />
        {integration.connected && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={integration.id} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 transition-colors">
            {integration.service}
          </h1>
          {integration.connected ? (
            <>
              <p className="text-sm text-neutral-400 mt-0.5">
                {integration.account}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Connected {formatDate(integration.connectedAt!)}
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-400 mt-0.5">
              {integration.description}
            </p>
          )}
        </div>
      </div>

      {!integration.connected && (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl p-4 transition-colors disabled:opacity-50"
        >
          {connecting ? "Connecting..." : `Connect ${integration.service}`}
        </button>
      )}

      {integration.connected && (
        <div className="mt-5">
          <h2 className="text-sm font-medium text-neutral-100 mb-3">
            Permissions
          </h2>
          <div className="flex flex-col gap-2">
            {integration.permissions.map((perm) => (
              <div
                key={perm.scope}
                className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 text-left"
              >
                <span className="text-sm text-neutral-100">{perm.label}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-neutral-400">Active</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
