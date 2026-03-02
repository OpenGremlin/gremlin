import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type { IntegrationQuery as IntegrationQueryType } from "../../../graphql/generated/graphql";
import {
  DisconnectIntegrationMutation,
  IntegrationQuery,
  SetIntegrationEnabledMutation,
  TogglePermissionMutation,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import googleLogo from "../../../assets/logos/Google.svg";

type Integration = NonNullable<IntegrationQueryType["integration"]>;

function IntegrationLogo({ id, icon, disabled }: { id: string; icon: string; disabled?: boolean }) {
  const opacity = disabled ? "opacity-40" : "";
  if (id === "google") {
    return <img src={googleLogo} alt="Google" className={`h-16 w-16 ${opacity} transition-opacity`} />;
  }
  return <span className={`text-5xl ${opacity} transition-opacity`}>{icon}</span>;
}

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(IntegrationQuery, { id: id! });
  const [localIntegration, setLocalIntegration] = useState<Integration | null>(
    null,
  );
  const [togglingScope, setTogglingScope] = useState<string | null>(null);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const integration = localIntegration ?? data?.integration ?? null;

  if (!integration) {
    return <NotFound label="Integration not found." />;
  }

  const disabled = !integration.enabled;

  async function handleToggle(scope: string, currentEnabled: boolean) {
    setTogglingScope(scope);
    try {
      const result = await gql<{ togglePermission: Integration }>(
        TogglePermissionMutation,
        { integrationId: id, scope, enabled: !currentEnabled },
      );
      setLocalIntegration(result.togglePermission);
    } finally {
      setTogglingScope(null);
    }
  }

  async function handleToggleEnabled() {
    setTogglingEnabled(true);
    try {
      const result = await gql<{ setIntegrationEnabled: Integration }>(
        SetIntegrationEnabledMutation,
        { id, enabled: !integration!.enabled },
      );
      setLocalIntegration(result.setIntegrationEnabled);
    } finally {
      setTogglingEnabled(false);
    }
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

  return (
    <div className="px-4 pt-6 pb-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={integration.id} icon={integration.icon} disabled={disabled} />
        <div>
          <h1 className={`text-xl font-semibold ${disabled ? "text-neutral-500" : "text-neutral-100"} transition-colors`}>
            {integration.service}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {integration.account}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Connected {formatDate(integration.connectedAt)}
          </p>
        </div>
      </div>

      {/* Enable/Disable toggle */}
      <button
        type="button"
        onClick={handleToggleEnabled}
        disabled={togglingEnabled}
        className="mt-5 flex items-center justify-between w-full bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        <span className="text-sm text-neutral-100">
          {disabled ? "Enable integration" : "Disable all permissions"}
        </span>
        <div
          className={`relative w-10 h-6 rounded-full transition-colors ${
            integration.enabled ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        >
          <div
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
              integration.enabled ? "left-5" : "left-1"
            }`}
          />
        </div>
      </button>

      <div className={`mt-5 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
        <h2 className="text-sm font-medium text-neutral-100 mb-3">
          Permissions
        </h2>
        <div className="flex flex-col gap-2">
          {integration.permissions.map((perm) => (
            <button
              key={perm.scope}
              type="button"
              disabled={togglingScope === perm.scope || disabled}
              onClick={() => handleToggle(perm.scope, perm.enabled)}
              className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 text-left"
            >
              <span className="text-sm text-neutral-100">{perm.label}</span>
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    perm.enabled ? "bg-green-400" : "bg-neutral-600"
                  }`}
                />
                <span className="text-neutral-400">
                  {perm.enabled ? "Enabled" : "Disabled"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
