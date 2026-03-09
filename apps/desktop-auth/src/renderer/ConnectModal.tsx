import { useState } from "react";
import { isCancelled } from "./errors.js";
import type { ProviderMeta } from "./providers.js";

interface ConnectModalProps {
  provider: ProviderMeta;
  initialClientId: string;
  initialClientSecret: string;
  onClose: () => void;
  onConnect: (config: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
  }) => Promise<void>;
}

export function ConnectModal({
  provider,
  initialClientId,
  initialClientSecret,
  onClose,
  onConnect,
}: ConnectModalProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(provider.scopes.map((s) => s.scope)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Client ID and Client Secret are required.");
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
        clientSecret: clientSecret.trim(),
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
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src={
              new URL(
                `../../../admin/src/assets/logos/${provider.logo}`,
                import.meta.url,
              ).href
            }
            alt={provider.service}
            className="h-8 w-8"
          />
          <div>
            <h2 className="text-lg font-semibold text-white">
              Connect {provider.service}
            </h2>
            <p className="text-sm text-neutral-400">{provider.description}</p>
          </div>
        </div>

        {/* Redirect URI */}
        <div className="mb-5 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="mb-1 text-xs font-medium text-neutral-400">
            Redirect URI (add this to your OAuth app)
          </p>
          <code className="text-sm text-indigo-400">
            http://localhost:19284/callback
          </code>
        </div>

        {/* Credentials */}
        <div className="mb-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Client ID
            </span>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
              placeholder="Enter your OAuth client ID"
              disabled={loading}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Client Secret
            </span>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
              placeholder="Enter your OAuth client secret"
              disabled={loading}
            />
          </label>
        </div>

        {/* Scopes */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Scopes</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-indigo-400 hover:text-indigo-300"
              disabled={loading}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="space-y-2">
            {provider.scopes.map((s) => (
              <label
                key={s.scope}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 hover:border-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={selectedScopes.has(s.scope)}
                  onChange={() => toggleScope(s.scope)}
                  className="accent-indigo-500"
                  disabled={loading}
                />
                <span className="text-sm text-white">{s.label}</span>
                <span className="ml-auto text-xs text-neutral-500">
                  {s.scope}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {loading ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
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
