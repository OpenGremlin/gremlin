import { useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "../../../auth";
import { ConnectGoogleMutation, IntegrationsQuery } from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

export function IntegrationsPage() {
  const { data, loading, error } = useQuery(IntegrationsQuery);
  const [connecting, setConnecting] = useState(false);

  const integrations = data?.integrations ?? [];
  const hasGoogle = integrations.some((i) => i.id === "google");

  async function handleConnectGoogle() {
    setConnecting(true);
    try {
      const result = await gql<{ connectGoogle: string }>(ConnectGoogleMutation);
      window.location.href = result.connectGoogle;
    } catch (err) {
      console.error("Failed to start Google OAuth:", err);
      setConnecting(false);
    }
  }

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {integrations.map((integration) => (
          <Link
            key={integration.id}
            to={`/integrations/${integration.id}`}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
          >
            <span className="text-3xl">{integration.icon}</span>
            <h3 className="text-sm font-medium text-neutral-100 mt-2">
              {integration.service}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {integration.account}
            </p>
          </Link>
        ))}
        {!hasGoogle && (
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={connecting}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 text-left disabled:opacity-50"
          >
            <span className="text-3xl">🔗</span>
            <h3 className="text-sm font-medium text-neutral-100 mt-2">
              {connecting ? "Connecting..." : "Connect Google"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Gmail & Google Docs
            </p>
          </button>
        )}
      </div>
    </>
  );
}
