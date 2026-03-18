import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { gql } from "./auth";
import { clientLogger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserInfoConfig =
  | { method: "id_token" }
  | {
      method: "rest";
      url: string;
      path: string;
      headers?: Record<string, string>;
    }
  | { method: "graphql"; url: string; query: string; path: string };

interface OAuthProviderConfig {
  providerId: string;
  authorizeUrl: string;
  tokenUrl: string;
  pkce: boolean;
  defaultScopes?: string[];
  scopePrefix?: string;
  extraAuthParams?: Record<string, string>;
  /** Some providers (Notion) require Basic auth for token exchange. */
  tokenAuthMethod?: "body" | "basic";
  defaultClientId?: string;
  defaultClientSecret?: string;
  userInfo: UserInfoConfig;
}

export interface OAuthFlowResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  scopes: string[];
}

// ---------------------------------------------------------------------------
// Provider configs — mirrors desktop-auth/src/main/oauth-configs.ts
// ---------------------------------------------------------------------------

const providerConfigs = new Map<string, OAuthProviderConfig>([
  [
    "google",
    {
      providerId: "google",
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      pkce: true,
      defaultScopes: ["openid", "email"],
      scopePrefix: "https://www.googleapis.com/auth/",
      extraAuthParams: { access_type: "offline", prompt: "consent" },
      defaultClientId:
        "641099907982-t0ev4f32k7ghr5g3otf8m3mi4q29nf9j.apps.googleusercontent.com",
      defaultClientSecret: "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",
      userInfo: { method: "id_token" },
    },
  ],
  [
    "notion",
    {
      providerId: "notion",
      authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      pkce: false,
      extraAuthParams: { owner: "user" },
      tokenAuthMethod: "basic",
      userInfo: {
        method: "rest",
        url: "https://api.notion.com/v1/users/me",
        path: "name",
        headers: { "Notion-Version": "2022-06-28" },
      },
    },
  ],
  [
    "linear",
    {
      providerId: "linear",
      authorizeUrl: "https://linear.app/oauth/authorize",
      tokenUrl: "https://api.linear.app/oauth/token",
      pkce: false,
      userInfo: {
        method: "graphql",
        url: "https://api.linear.app/graphql",
        query: "{ viewer { email } }",
        path: "data.viewer.email",
      },
    },
  ],
  [
    "discord",
    {
      providerId: "discord",
      authorizeUrl: "https://discord.com/api/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      pkce: false,
      defaultScopes: ["identify", "email"],
      userInfo: {
        method: "rest",
        url: "https://discord.com/api/users/@me",
        path: "email",
      },
    },
  ],
  [
    "teams",
    {
      providerId: "teams",
      authorizeUrl:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      pkce: true,
      defaultScopes: ["openid", "email", "offline_access"],
      scopePrefix: "https://graph.microsoft.com/",
      userInfo: {
        method: "rest",
        url: "https://graph.microsoft.com/v1.0/me",
        path: "mail",
      },
    },
  ],
  [
    "github",
    {
      providerId: "github",
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      pkce: false,
      userInfo: {
        method: "rest",
        url: "https://api.github.com/user",
        path: "login",
      },
    },
  ],
  [
    "gitlab",
    {
      providerId: "gitlab",
      authorizeUrl: "https://gitlab.com/oauth/authorize",
      tokenUrl: "https://gitlab.com/oauth/token",
      pkce: false,
      userInfo: {
        method: "rest",
        url: "https://gitlab.com/api/v4/user",
        path: "email",
      },
    },
  ],
  [
    "jira",
    {
      providerId: "jira",
      authorizeUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      pkce: false,
      extraAuthParams: { audience: "api.atlassian.com", prompt: "consent" },
      userInfo: {
        method: "rest",
        url: "https://api.atlassian.com/me",
        path: "email",
      },
    },
  ],
  [
    "spotify",
    {
      providerId: "spotify",
      authorizeUrl: "https://accounts.spotify.com/authorize",
      tokenUrl: "https://accounts.spotify.com/api/token",
      pkce: false,
      defaultClientId: "c7d96c11accd4e3ebdaa9fcd32e9e1b6",
      defaultClientSecret: "bd7c953c3ce747288f231bc1abcf40e0",
      userInfo: {
        method: "rest",
        url: "https://api.spotify.com/v1/me",
        path: "email",
      },
    },
  ],
]);

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const verifierBytes = Crypto.getRandomBytes(32);
  const codeVerifier = toBase64Url(verifierBytes);

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  // Convert standard base64 to base64url
  const codeChallenge = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { codeVerifier, codeChallenge };
}

// ---------------------------------------------------------------------------
// Account ID resolution
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  let current = obj;
  for (const part of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) return {};
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

async function resolveAccountId(
  userInfo: UserInfoConfig,
  tokens: { accessToken: string; idToken?: string },
): Promise<string> {
  try {
    switch (userInfo.method) {
      case "id_token": {
        if (!tokens.idToken) return "unknown";
        const claims = decodeJwtPayload(tokens.idToken);
        return (claims.email as string) ?? "unknown";
      }
      case "rest": {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${tokens.accessToken}`,
          ...(userInfo.headers ?? {}),
        };
        const res = await fetch(userInfo.url, { headers });
        if (!res.ok) return "unknown";
        const data = await res.json();
        return String(getNestedValue(data, userInfo.path) ?? "unknown");
      }
      case "graphql": {
        const res = await fetch(userInfo.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: userInfo.query }),
        });
        if (!res.ok) return "unknown";
        const data = await res.json();
        return String(getNestedValue(data, userInfo.path) ?? "unknown");
      }
    }
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

async function exchangeCode(
  config: OAuthProviderConfig,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  codeVerifier: string | null,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (config.tokenAuthMethod === "basic") {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

// ---------------------------------------------------------------------------
// Redirect URI
// ---------------------------------------------------------------------------

const REDIRECT_URI = "gremlin://oauth/callback";

// ---------------------------------------------------------------------------
// Main OAuth flow
// ---------------------------------------------------------------------------

export function isOAuthAvailable(): boolean {
  return Platform.OS !== "web";
}

export function getOAuthDefaults(providerId: string): {
  clientId: string;
  clientSecret: string;
} {
  const config = providerConfigs.get(providerId);
  return {
    clientId: config?.defaultClientId ?? "",
    clientSecret: config?.defaultClientSecret ?? "",
  };
}

export async function startOAuthFlow(
  providerId: string,
  clientId: string,
  clientSecret: string,
  scopes: string[],
): Promise<OAuthFlowResult> {
  const config = providerConfigs.get(providerId);
  if (!config) {
    throw new Error(`No OAuth config for provider: ${providerId}`);
  }

  // Build scopes
  const allScopes = [
    ...(config.defaultScopes ?? []),
    ...scopes.map((s) =>
      config.scopePrefix ? `${config.scopePrefix}${s}` : s,
    ),
  ];

  // Generate PKCE if needed
  let codeVerifier: string | null = null;
  let codeChallenge: string | null = null;
  if (config.pkce) {
    const pkce = await generatePKCE();
    codeVerifier = pkce.codeVerifier;
    codeChallenge = pkce.codeChallenge;
  }

  // Generate state
  const stateBytes = Crypto.getRandomBytes(16);
  const state = toBase64Url(stateBytes);

  // Build authorization URL
  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  if (allScopes.length > 0) {
    authUrl.searchParams.set("scope", allScopes.join(" "));
  }

  if (codeChallenge) {
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
  }

  if (config.extraAuthParams) {
    for (const [key, value] of Object.entries(config.extraAuthParams)) {
      authUrl.searchParams.set(key, value);
    }
  }

  clientLogger.info("Starting OAuth flow", { providerId });

  // Open browser and wait for redirect
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl.toString(),
    REDIRECT_URI,
  );

  if (result.type !== "success") {
    throw new Error("OAuth flow was cancelled");
  }

  // Parse the callback URL
  const callbackUrl = new URL(result.url);
  const error = callbackUrl.searchParams.get("error");
  if (error) {
    const errorDesc = callbackUrl.searchParams.get("error_description");
    throw new Error(
      `OAuth error: ${error}${errorDesc ? ` - ${errorDesc}` : ""}`,
    );
  }

  const code = callbackUrl.searchParams.get("code");
  const returnedState = callbackUrl.searchParams.get("state");

  if (!code) {
    throw new Error("No authorization code in callback");
  }
  if (returnedState !== state) {
    throw new Error("State mismatch in OAuth callback");
  }

  // Exchange code for tokens
  const tokens = await exchangeCode(
    config,
    code,
    REDIRECT_URI,
    clientId,
    clientSecret,
    codeVerifier,
  );

  // Resolve account ID
  const accountId = await resolveAccountId(config.userInfo, tokens);

  clientLogger.info("OAuth flow completed", { providerId, accountId });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : undefined,
    accountId,
    scopes,
  };
}

// ---------------------------------------------------------------------------
// Submit to server
// ---------------------------------------------------------------------------

import { SubmitOAuthConnectionMutation } from "../graphql/queries/integrations";

export async function connectOAuthProvider(
  providerId: string,
  clientId: string,
  clientSecret: string,
  scopes: string[],
): Promise<OAuthFlowResult> {
  const result = await startOAuthFlow(
    providerId,
    clientId,
    clientSecret,
    scopes,
  );

  const config = providerConfigs.get(providerId);
  await gql(SubmitOAuthConnectionMutation, {
    providerId,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
    expiresAt: result.expiresAt ?? null,
    scopes: result.scopes,
    accountId: result.accountId ?? null,
    clientId,
    clientSecret,
    tokenUrl: config?.tokenUrl ?? null,
    tokenAuthMethod: config?.tokenAuthMethod ?? null,
  });

  return result;
}
