import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  applyServerConfig,
  loadServerConfig,
  type ServerConfig,
  saveServerConfig,
} from "./config";

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
 * Fetches server config for web.
 * Production: /.well-known/gremlin-config.json (served by CloudFront)
 * Dev: falls back to EXPO_PUBLIC_ env vars from .env
 */
async function fetchWebConfig(): Promise<ServerConfig | null> {
  try {
    const res = await fetch("/.well-known/gremlin-config.json");
    if (res.ok) {
      const data = await res.json();
      if (data.cognitoDomain && data.cognitoClientId) {
        return {
          serverUrl: data.apiUrl || window.location.origin,
          cognitoDomain: data.cognitoDomain,
          cognitoClientId: data.cognitoClientId,
        };
      }
    }
  } catch {
    // Expected to fail in local dev — fall through to env vars
  }

  const domain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
  if (domain && clientId) {
    return { serverUrl: "", cognitoDomain: domain, cognitoClientId: clientId };
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
      if (Platform.OS === "web") {
        cfg = await fetchWebConfig();
      } else {
        cfg = await loadServerConfig();
      }
      if (cfg) applyServerConfig(cfg);
      setState({ config: cfg, loaded: true });
    })();
  }, []);

  const setConfig = useCallback(async (cfg: ServerConfig) => {
    await saveServerConfig(cfg);
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
