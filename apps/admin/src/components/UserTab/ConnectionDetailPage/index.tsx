import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  IntegrationConnectionsQuery,
  RenameConnectionMutation,
  RevokeConnectionMutation,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useTitle } from "../../../hooks/useTitle";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
import { IntegrationLogo } from "../../../shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../shared/QueryResult";

export function ConnectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    IntegrationConnectionsQuery,
  );
  const connection =
    data?.integrationConnections.find((c) => c.id === id) ?? null;
  useTitle(connection?.description ?? "Connection");
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  if (!connection) {
    return <NotFound label="Connection not found." />;
  }

  const meta = connection.meta;
  const accountId = meta.accountId ?? null;
  const scopes = meta.__typename === "OAuthConnectionMeta" ? meta.scopes : null;
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
    setRevokeError(null);
    try {
      await gql<{ revokeIntegrationConnection: boolean }>(
        RevokeConnectionMutation,
        { id },
      );
      navigate("/settings/integrations");
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Failed to revoke connection",
      );
      setRevoking(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <BackButton to="/settings/integrations" />
        <button
          type="button"
          onClick={handleRevoke}
          disabled={revoking}
          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {revoking ? "Revoking..." : "Revoke"}
        </button>
      </div>

      {revokeError && (
        <div className="mt-3 bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
          {revokeError}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={connection.providerId} size={12} />
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
            <button
              type="button"
              onClick={startEditing}
              className="text-xl font-semibold text-neutral-100 cursor-pointer hover:text-neutral-300 transition-colors text-left"
            >
              {connection.description}
            </button>
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
            <span className="text-neutral-100">
              {connection.connectionType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
