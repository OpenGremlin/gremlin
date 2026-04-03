import Constants from "expo-constants";
import { storage } from "./storage";

export interface ServerConfig {
  serverUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
}

interface AppConfig {
  apiUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
  skipAuth: boolean;
}

const extra = Constants.expoConfig?.extra ?? {};

// ── Persistent server config (native: secure store, web: localStorage) ──

const SERVER_URL_KEY = "gremlin_server_url";
const COGNITO_DOMAIN_KEY = "gremlin_cognito_domain";
const COGNITO_CLIENT_ID_KEY = "gremlin_cognito_client_id";

let _serverConfig: ServerConfig | null = null;

export async function loadServerConfig(): Promise<ServerConfig | null> {
  const [serverUrl, cognitoDomain, cognitoClientId] = await Promise.all([
    storage.getItem(SERVER_URL_KEY),
    storage.getItem(COGNITO_DOMAIN_KEY),
    storage.getItem(COGNITO_CLIENT_ID_KEY),
  ]);
  if (serverUrl) {
    _serverConfig = {
      serverUrl,
      cognitoDomain: cognitoDomain ?? "",
      cognitoClientId: cognitoClientId ?? "",
    };
    return _serverConfig;
  }
  return null;
}

export async function saveServerConfig(cfg: ServerConfig): Promise<void> {
  await Promise.all([
    storage.setItem(SERVER_URL_KEY, cfg.serverUrl),
    storage.setItem(COGNITO_DOMAIN_KEY, cfg.cognitoDomain),
    storage.setItem(COGNITO_CLIENT_ID_KEY, cfg.cognitoClientId),
  ]);
  applyServerConfig(cfg);
}

export async function clearServerConfig(): Promise<void> {
  await Promise.all([
    storage.deleteItem(SERVER_URL_KEY),
    storage.deleteItem(COGNITO_DOMAIN_KEY),
    storage.deleteItem(COGNITO_CLIENT_ID_KEY),
  ]);
  _serverConfig = null;
}

export function getServerConfig(): ServerConfig | null {
  return _serverConfig;
}

// ── App config singleton (populated by ServerConfigProvider) ──

export const config: AppConfig = {
  apiUrl: "",
  cognitoDomain: "",
  cognitoClientId: "",
  skipAuth:
    extra.skipAuth === true || process.env.EXPO_PUBLIC_SKIP_AUTH === "true",
};

/** Apply a loaded server config to the app config singleton */
export function applyServerConfig(cfg: ServerConfig): void {
  _serverConfig = cfg;
  config.apiUrl = cfg.serverUrl;
  config.cognitoDomain = cfg.cognitoDomain;
  config.cognitoClientId = cfg.cognitoClientId;
}

export function getApiUrl(): string {
  if (__DEV__ && !config.apiUrl) {
    return "http://localhost:3001";
  }
  return config.apiUrl;
}
