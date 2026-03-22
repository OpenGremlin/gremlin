import type { ServerConfig } from "./config";

const COGNITO_DOMAIN_RE =
  /^https:\/\/[\w-]+\.auth\.[\w-]+\.amazoncognito\.com$/;

/** Encode a string as base64url (no padding) */
export function encodeBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Build a gremlin:// deep link URL for a server */
export function buildConnectUrl(serverUrl: string): string {
  return `gremlin://connect/${encodeBase64Url(serverUrl)}`;
}

/** Decode a gremlin://connect/<base64url> QR payload. Returns the server URL or null. */
export function decodeQrPayload(data: string): string | null {
  const match = data.match(/^gremlin:\/\/connect\/(.+)$/);
  if (!match) return null;
  try {
    const base64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    return atob(base64);
  } catch {
    return null;
  }
}

/** Validate that a Cognito domain string looks like a real AWS Cognito domain */
export function isValidCognitoDomain(domain: string): boolean {
  return COGNITO_DOMAIN_RE.test(`https://${domain}`);
}

/** Fetch and validate server config from a /.well-known endpoint */
export async function fetchServerConfig(
  serverUrl: string,
): Promise<ServerConfig> {
  const url = `${serverUrl.replace(/\/$/, "")}/.well-known/gremlin-config.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  const cfg = await res.json();

  if (!cfg.cognitoDomain || !cfg.cognitoClientId) {
    throw new Error("Invalid server config: missing required fields");
  }
  if (!isValidCognitoDomain(cfg.cognitoDomain)) {
    throw new Error("Invalid Cognito domain");
  }

  return {
    serverUrl: cfg.apiUrl || serverUrl,
    cognitoDomain: cfg.cognitoDomain,
    cognitoClientId: cfg.cognitoClientId,
  };
}
