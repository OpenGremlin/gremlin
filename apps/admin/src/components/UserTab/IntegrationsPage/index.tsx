import { useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "../../../auth";
import { ConnectGoogleMutation, IntegrationsQuery } from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import googleLogo from "../../../assets/logos/Google.svg";

function IntegrationIcon({ id, icon }: { id: string; icon: string }) {
  if (id === "google") {
    return <img src={googleLogo} alt="Google" className="h-14 w-14" />;
  }
  return <span className="text-5xl">{icon}</span>;
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
      <div className="flex flex-col gap-3 px-4 pb-6">
        {integrations.map((integration) => (
          <Link
            key={integration.id}
            to={`/integrations/${integration.id}`}
            className="flex items-center gap-4 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 group"
          >
            <div className="flex-shrink-0">
              <IntegrationIcon id={integration.id} icon={integration.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-neutral-100">
                {integration.service}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5 truncate">
                {integration.account}
              </p>
              <StatusBadge connected />
            </div>
            <div className="flex-shrink-0 transition-transform group-hover:translate-x-0.5">
              <ChevronRight />
            </div>
          </Link>
        ))}
        {!hasGoogle && (
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={connecting}
            className="flex items-center gap-4 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800 text-left disabled:opacity-50 group"
          >
            <div className="flex-shrink-0">
              <img src={googleLogo} alt="Google" className="h-14 w-14 opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-neutral-100">
                {connecting ? "Connecting..." : "Connect Google"}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Gmail & Google Docs
              </p>
              <StatusBadge connected={false} />
            </div>
            <div className="flex-shrink-0 transition-transform group-hover:translate-x-0.5">
              <ChevronRight />
            </div>
          </button>
        )}
      </div>
    </>
  );
}
