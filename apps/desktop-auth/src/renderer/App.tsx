import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectModal } from "./ConnectModal.js";
import { isCancelled } from "./errors.js";
import { oauthProviders, type ProviderMeta } from "./providers.js";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface ProviderState {
  status: ConnectionStatus;
  accountId?: string;
}

interface ConnectionInfo {
  id: string;
  providerId: string;
  description: string;
  connectedAt: string;
  accountId?: string;
  scopes: string[];
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
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [expandedConnectionId, setExpandedConnectionId] = useState<
    string | null
  >(null);
  const [showServerHelp, setShowServerHelp] = useState(false);

  // Cognito refresh state (not persisted — refresh token is kept in localStorage)
  const cognitoConfigRef = useRef<{
    cognitoDomain: string;
    clientId: string;
  } | null>(null);

  // Persist server URL and auth token
  useEffect(() => savePersistent("gremlin-server-url", serverUrl), [serverUrl]);
  useEffect(() => savePersistent("gremlin-auth-token", authToken), [authToken]);

  // On mount with existing token, fetch auth config so we can refresh later
  useEffect(() => {
    if (!authToken || !serverUrl.trim() || cognitoConfigRef.current) return;
    const url = serverUrl.replace(/\/+$/, "");
    fetch(`${url}/api/auth-config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cognitoDomain && data?.clientId) {
          cognitoConfigRef.current = {
            cognitoDomain: data.cognitoDomain,
            clientId: data.clientId,
          };
        }
      })
      .catch(() => {});
  }, [authToken, serverUrl]);

  // Auto-refresh Cognito token before expiry
  useEffect(() => {
    const refreshToken = loadSaved("gremlin-cognito-refresh-token");
    const expiresAt = Number(loadSaved("gremlin-cognito-expires-at", "0"));
    const config = cognitoConfigRef.current;

    if (!authToken || !refreshToken || !config || !expiresAt) return;

    // Refresh 5 minutes before expiry
    const msUntilRefresh = expiresAt - Date.now() - 5 * 60 * 1000;
    if (msUntilRefresh <= 0) {
      // Already past the refresh window — try immediately
      doRefresh();
      return;
    }

    const timer = setTimeout(doRefresh, msUntilRefresh);
    return () => clearTimeout(timer);

    function doRefresh() {
      if (!config) return;
      window.electronAPI
        .cognitoRefresh({
          cognitoDomain: config.cognitoDomain,
          clientId: config.clientId,
          refreshToken,
        })
        .then((result) => {
          setAuthToken(result.idToken);
          savePersistent(
            "gremlin-cognito-expires-at",
            String(Date.now() + result.expiresIn * 1000),
          );
        })
        .catch(() => {
          // Refresh failed — force re-login
          handleLogout();
        });
    }
  }, [authToken]);

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
          integrationConnections {
            id
            providerId
            connectionType
            description
            connectedAt
            isRevoked
            meta {
              ... on OAuthConnectionMeta {
                accountId
                scopes
              }
            }
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
        const conns: ConnectionInfo[] = data.integrationConnections
          .filter(
            (c: { connectionType: string; isRevoked: boolean }) =>
              c.connectionType === "oauth" && !c.isRevoked,
          )
          .map(
            (c: {
              id: string;
              providerId: string;
              description: string;
              connectedAt: string;
              meta: { accountId?: string; scopes?: string[] };
            }) => ({
              id: c.id,
              providerId: c.providerId,
              description: c.description,
              connectedAt: c.connectedAt,
              accountId: c.meta?.accountId,
              scopes: c.meta?.scopes ?? [],
            }),
          );
        setConnections(conns);
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

      const result = await window.electronAPI.cognitoLogin({
        cognitoDomain,
        clientId,
      });
      cognitoConfigRef.current = { cognitoDomain, clientId };
      savePersistent("gremlin-cognito-refresh-token", result.refreshToken);
      savePersistent(
        "gremlin-cognito-expires-at",
        String(Date.now() + result.expiresIn * 1000),
      );
      setAuthToken(result.idToken);
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
    setConnections([]);
    cognitoConfigRef.current = null;
    localStorage.removeItem("gremlin-auth-token");
    localStorage.removeItem("gremlin-cognito-refresh-token");
    localStorage.removeItem("gremlin-cognito-expires-at");
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
    setConnections((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        providerId: provider.id,
        description: provider.service,
        connectedAt: new Date().toISOString(),
        accountId: result.accountId,
        scopes: result.scopes,
      },
    ]);
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
                <button
                  type="button"
                  className="relative cursor-help text-neutral-500 hover:text-neutral-300"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowServerHelp((v) => !v);
                  }}
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
                  {showServerHelp && (
                    <div className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-normal text-neutral-300 shadow-lg">
                      Deploy Gremlin using CDK first, then paste your
                      CloudFront URL here (e.g.
                      https://abc123.cloudfront.net).
                    </div>
                  )}
                </button>
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

        {/* Connected providers */}
        {isLoggedIn && connections.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Connected
            </h2>
            <div className="space-y-2">
              {connections.map((conn) => {
                const provider = oauthProviders.find(
                  (p) => p.id === conn.providerId,
                );
                if (!provider) return null;
                const isExpanded = expandedConnectionId === conn.id;
                const scopeLabels = conn.scopes.map((s) => {
                  const match = provider.scopes.find((ps) => ps.scope === s);
                  return match ? match.label : s;
                });
                return (
                  <div
                    key={conn.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedConnectionId(isExpanded ? null : conn.id)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <img
                        src={
                          new URL(
                            `../../../admin/src/assets/logos/${provider.logo}`,
                            import.meta.url,
                          ).href
                        }
                        alt={provider.service}
                        className="h-6 w-6"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">
                          {provider.service}
                        </span>
                        {conn.accountId && conn.accountId !== "unknown" && (
                          <span className="ml-2 text-xs text-neutral-400">
                            {conn.accountId}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-neutral-500">
                        {new Date(conn.connectedAt).toLocaleDateString()}
                      </span>
                      <span className="shrink-0 rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Connected
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-neutral-800 px-4 py-3">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-500">
                          Enabled Scopes
                        </span>
                        {scopeLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {scopeLabels.map((label) => (
                              <span
                                key={label}
                                className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500">
                            No scopes recorded
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
