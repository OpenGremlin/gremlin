import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearToken } from "./auth";
import {
  applyServerConfig,
  loadServerConfig,
  type ServerConfig,
  saveServerConfig,
} from "./config";
import { initWsClient } from "./wsClient";

interface ServerConfigState {
  config: ServerConfig | null;
  loaded: boolean;
  /** Persist and apply a new server config (used after QR scan) */
  setConfig: (cfg: ServerConfig) => Promise<void>;
}

const ServerConfigContext = createContext<ServerConfigState>({
  config: null,
  loaded: false,
  setConfig: async () => {},
});

/**
 * Fetches server config for web from /api/auth-config.
 * In prod, CloudFront routes /api/* to the server.
 * In dev, the Expo proxy or CORS handles localhost:3001.
 */
async function fetchWebConfig(): Promise<ServerConfig | null> {
  // 1. Check localStorage for a previously saved config (e.g. from connect screen)
  const saved = await loadServerConfig();
  if (saved) return saved;

  // 2. Try same-origin — works in prod where CloudFront serves app + API.
  //    In dev, fall back to localhost:3001 so queries work without the connect screen.
  const baseUrl = __DEV__ ? "http://localhost:3001" : "";
  try {
    const res = await fetch(`${baseUrl}/api/auth-config`);
    if (res.ok) {
      const data = await res.json();
      const serverUrl = baseUrl || window.location.origin;
      return {
        serverUrl,
        cognitoDomain: data.cognitoDomain ?? "",
        cognitoClientId: data.clientId ?? "",
      };
    }
  } catch {
    // Server not running — show connect screen
  }
  return null;
}

export function ServerConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{
    config: ServerConfig | null;
    loaded: boolean;
  }>({ config: null, loaded: false });

  useEffect(() => {
    (async () => {
      let cfg: ServerConfig | null = null;
      if (process.env.EXPO_OS === "web") {
        cfg = await fetchWebConfig();
      } else {
        cfg = await loadServerConfig();
      }
      if (cfg) {
        applyServerConfig(cfg);
        initWsClient();
      }
      setState({ config: cfg, loaded: true });
    })();
  }, []);

  const setConfig = useCallback(async (cfg: ServerConfig) => {
    // Clear tokens from the previous server so stale credentials
    // aren't sent to a different Cognito user pool.
    await clearToken();
    await saveServerConfig(cfg);
    initWsClient();
    setState({ config: cfg, loaded: true });
  }, []);

  if (!state.loaded) return null;

  return (
    <ServerConfigContext.Provider
      value={{ config: state.config, loaded: state.loaded, setConfig }}
    >
      {children}
    </ServerConfigContext.Provider>
  );
}

export function useServerConfig() {
  return useContext(ServerConfigContext);
}
