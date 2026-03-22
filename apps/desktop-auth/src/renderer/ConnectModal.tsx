import { useState } from "react";
import { isCancelled } from "./errors.js";
import { getLogoUrl, type ProviderMeta } from "./providers.js";
import { useTheme } from "./useTheme.js";

interface ConnectModalProps {
  provider: ProviderMeta;
  initialClientId: string;
  onClose: () => void;
  onConnect: (config: { clientId: string; scopes: string[] }) => Promise<void>;
}

export function ConnectModal({
  provider,
  initialClientId,
  onClose,
  onConnect,
}: ConnectModalProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(provider.scopes.map((s) => s.scope)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();

  const allSelected = selectedScopes.size === provider.scopes.length;

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedScopes(new Set());
    } else {
      setSelectedScopes(new Set(provider.scopes.map((s) => s.scope)));
    }
  }

  async function handleConnect() {
    if (!clientId.trim()) {
      setError("Client ID is required.");
      return;
    }
    if (selectedScopes.size === 0) {
      setError("Select at least one scope.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConnect({
        clientId: clientId.trim(),
        scopes: [...selectedScopes],
      });
    } catch (err) {
      if (!isCancelled(err)) {
        setError(err instanceof Error ? err.message : String(err));
      }
      setLoading(false);
    }
  }

  function handleCancel() {
    window.electronAPI.cancelAuthFlow();
    onClose();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click-to-close
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-edge bg-page p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src={getLogoUrl(provider, isDark)}
            alt={provider.service}
            className="h-8 w-8"
          />
          <div>
            <h2 className="text-lg font-semibold text-fg">
              Connect {provider.service}
            </h2>
            <p className="text-sm text-fg-muted">{provider.description}</p>
          </div>
        </div>

        {/* Redirect URI */}
        <div className="mb-5 rounded-lg border border-edge bg-card p-3">
          <p className="mb-1 text-xs font-medium text-fg-muted">
            Redirect URI (add this to your OAuth app)
          </p>
          <code className="text-sm text-accent">
            http://localhost:19284/callback
          </code>
        </div>

        {/* Credentials */}
        <div className="mb-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-fg-secondary">
              Client ID
            </span>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-edge-strong bg-card px-3 py-2 text-sm text-fg placeholder-fg-faint outline-none focus:border-indigo-500"
              placeholder="Enter your OAuth client ID"
              disabled={loading}
            />
          </label>
        </div>

        {/* Scopes */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-fg-secondary">
              Scopes
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-accent hover:text-accent-hover"
              disabled={loading}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="space-y-2">
            {provider.scopes.map((s) => (
              <label
                key={s.scope}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-card px-3 py-2 hover:border-edge-strong"
              >
                <input
                  type="checkbox"
                  checked={selectedScopes.has(s.scope)}
                  onChange={() => toggleScope(s.scope)}
                  className="accent-indigo-500"
                  disabled={loading}
                />
                <span className="text-sm text-fg">{s.label}</span>
                <span className="ml-auto text-xs text-fg-faint">{s.scope}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-error-border bg-error-bg p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {loading ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-edge-strong px-4 py-2 text-sm text-fg-secondary hover:bg-card-alt"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-edge-strong px-4 py-2 text-sm text-fg-secondary hover:bg-card-alt"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConnect}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Connect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
