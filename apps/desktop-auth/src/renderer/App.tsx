import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectModal } from "./ConnectModal.js";
import { isCancelled } from "./errors.js";
import { oauthProviders, type ProviderMeta } from "./providers.js";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface ProviderState {
  status: ConnectionStatus;
  accountId?: string;
}

function loadSaved(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePersistent(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function App() {
  const [serverUrl, setServerUrl] = useState(() =>
    loadSaved("gremlin-server-url"),
  );
  const [authToken, setAuthToken] = useState(() =>
    loadSaved("gremlin-auth-token"),
  );
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [providerStates, setProviderStates] = useState<
    Record<string, ProviderState>
  >({});
  const [activeProvider, setActiveProvider] = useState<ProviderMeta | null>(
    null,
  );

  // Persist server URL and auth token
  useEffect(() => savePersistent("gremlin-server-url", serverUrl), [serverUrl]);
  useEffect(() => savePersistent("gremlin-auth-token", authToken), [authToken]);

  const graphqlFetch = useCallback(
    async (query: string, variables?: Record<string, unknown>) => {
      const url = serverUrl.replace(/\/+$/, "");
      const res = await fetch(`${url}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);
      return json.data;
    },
    [serverUrl, authToken],
  );
  const graphqlFetchRef = useRef(graphqlFetch);
  graphqlFetchRef.current = graphqlFetch;

  // When we have a token, test connection automatically
  useEffect(() => {
    if (!authToken || !serverUrl.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlFetchRef.current(`{
          integrationProviders {
            id
            connectionType
            hasConnection
          }
        }`);
        if (cancelled) return;
        const states: Record<string, ProviderState> = {};
        for (const p of data.integrationProviders) {
          if (p.connectionType === "oauth") {
            states[p.id] = {
              status: p.hasConnection ? "connected" : "disconnected",
            };
          }
        }
        setProviderStates(states);
        setConnectionOk(true);
      } catch {
        if (!cancelled) setConnectionOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, serverUrl]);

  async function handleLogin() {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const url = serverUrl.replace(/\/+$/, "");
      const res = await fetch(`${url}/api/auth-config`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const { cognitoDomain, clientId } = await res.json();
      if (!cognitoDomain || !clientId) {
        throw new Error("Server auth not configured");
      }

      const idToken = await window.electronAPI.cognitoLogin({
        cognitoDomain,
        clientId,
      });
      setAuthToken(idToken);
    } catch (err) {
      if (!isCancelled(err)) {
        setLoginError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    setAuthToken("");
    setConnectionOk(null);
    setProviderStates({});
    localStorage.removeItem("gremlin-auth-token");
  }

  async function handleConnect(
    provider: ProviderMeta,
    config: { clientId: string; clientSecret: string; scopes: string[] },
  ) {
    // Save credentials for this provider
    savePersistent(`gremlin-${provider.id}-clientId`, config.clientId);
    savePersistent(`gremlin-${provider.id}-clientSecret`, config.clientSecret);

    // Start OAuth flow via IPC
    const result = await window.electronAPI.startOAuth({
      providerId: provider.id,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scopes: config.scopes,
    });

    // Submit to server
    await graphqlFetch(
      `mutation SubmitOAuthConnection(
        $providerId: String!
        $accessToken: String!
        $refreshToken: String
        $expiresAt: String
        $scopes: [String!]!
        $accountId: String
      ) {
        submitOAuthConnection(
          providerId: $providerId
          accessToken: $accessToken
          refreshToken: $refreshToken
          expiresAt: $expiresAt
          scopes: $scopes
          accountId: $accountId
        )
      }`,
      {
        providerId: provider.id,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? null,
        expiresAt: result.expiresAt ?? null,
        scopes: result.scopes,
        accountId: result.accountId ?? null,
      },
    );

    // Update state
    setProviderStates((prev) => ({
      ...prev,
      [provider.id]: {
        status: "connected",
        accountId: result.accountId,
      },
    }));
    setActiveProvider(null);
  }

  const isLoggedIn = connectionOk === true && !!authToken;

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">
      {/* Title bar drag region */}
      <div
        className="flex h-12 shrink-0 items-center justify-center border-b border-neutral-800"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-sm font-semibold text-neutral-300">
          Gremlin Connect
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Server connection */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Server Connection
          </h2>
          <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <label className="block">
              <div className="group relative mb-1 flex items-center gap-1.5">
                <span className="text-sm font-medium text-neutral-300">
                  Your Gremlin Server
                </span>
                <span
                  className="cursor-help text-neutral-500"
                  title="Deploy Gremlin using CDK first, then paste your CloudFront URL here (e.g. https://abc123.cloudfront.net)."
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    role="img"
                    aria-label="Help"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 .75.75 0 0 1 1.06 1.06ZM10 8.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setConnectionOk(null);
                  setLoginError(null);
                }}
                disabled={isLoggedIn}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="https://your-deployment.cloudfront.net"
              />
            </label>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600"
                >
                  Log out
                </button>
              ) : loggingIn ? (
                <button
                  type="button"
                  onClick={() => window.electronAPI.cancelAuthFlow()}
                  className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={!serverUrl.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Log in
                </button>
              )}
              {isLoggedIn && (
                <span className="text-sm text-emerald-400">Connected</span>
              )}
              {connectionOk === false && authToken && (
                <span className="text-sm text-red-400">Connection failed</span>
              )}
              {loginError && (
                <span className="text-sm text-red-400">{loginError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Provider grid */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            OAuth Providers
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {oauthProviders.map((provider) => {
              const state = providerStates[provider.id];
              const isConnected = state?.status === "connected";

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setActiveProvider(provider)}
                  disabled={!isLoggedIn}
                  className="group flex flex-col items-start rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="mb-3 flex w-full items-center justify-between">
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
                    {isConnected && (
                      <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {provider.service}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {provider.description}
                  </span>
                  {state?.accountId && state.accountId !== "unknown" && (
                    <span className="mt-1 text-xs text-neutral-500">
                      {state.accountId}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connect modal */}
      {activeProvider && (
        <ConnectModal
          provider={activeProvider}
          initialClientId={
            loadSaved(`gremlin-${activeProvider.id}-clientId`) ||
            activeProvider.defaultClientId ||
            ""
          }
          initialClientSecret={
            loadSaved(`gremlin-${activeProvider.id}-clientSecret`) ||
            activeProvider.defaultClientSecret ||
            ""
          }
          onClose={() => setActiveProvider(null)}
          onConnect={(config) => handleConnect(activeProvider, config)}
        />
      )}
    </div>
  );
}
