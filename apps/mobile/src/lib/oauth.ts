import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { execute } from "./apolloClient";
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
      httpMethod?: "GET" | "POST";
    }
  | { method: "graphql"; url: string; query: string; path: string };

export interface OAuthPlatformOverride {
  clientId: string;
  redirectUri: string;
}

export interface OAuthProviderConfig {
  id: string;
  authorizeUrl?: string | null;
  tokenUrl?: string | null;
  defaultClientId?: string | null;
  defaultScopes?: ReadonlyArray<string> | null;
  scopePrefix?: string | null;
  extraAuthParams?: string | null;
  userInfo?: string | null;
  ios?: OAuthPlatformOverride | null;
  android?: OAuthPlatformOverride | null;
}

export interface OAuthFlowResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  scopes: string[];
}

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
        const res = await fetch(userInfo.url, {
          method: userInfo.httpMethod ?? "GET",
          headers,
        });
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
  tokenUrl: string,
  code: string,
  redirectUri: string,
  clientId: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
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

const DEFAULT_REDIRECT_URI = "https://opengremlin.com/oauth/callback";

// ---------------------------------------------------------------------------
// Platform-aware client resolution
// ---------------------------------------------------------------------------

function resolvePlatformOAuth(provider: OAuthProviderConfig): {
  clientId: string;
  redirectUri: string;
} {
  const override =
    Platform.OS === "ios"
      ? provider.ios
      : Platform.OS === "android"
        ? provider.android
        : null;

  return {
    clientId: override?.clientId ?? provider.defaultClientId ?? "",
    redirectUri: override?.redirectUri ?? DEFAULT_REDIRECT_URI,
  };
}

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

/** Open an auth session using the right strategy for the redirect URI scheme. */
async function openAuthAndWaitForCallback(
  authUrl: string,
  redirectUri: string,
): Promise<URL> {
  // Custom schemes (e.g. com.googleusercontent.apps.XXX://) work natively
  // with openAuthSessionAsync which gives an in-app browser sheet.
  if (!redirectUri.startsWith("https://")) {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    if (result.type !== "success") {
      throw new Error("OAuth flow was cancelled");
    }
    return new URL(result.url);
  }

  // HTTPS redirect URIs (universal links) require a Linking listener
  // because ASWebAuthenticationSession doesn't intercept https callbacks.
  return new Promise<URL>((resolve, reject) => {
    let resolved = false;
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (!url.startsWith(redirectUri)) return;
      resolved = true;
      subscription.remove();
      WebBrowser.dismissBrowser();
      resolve(new URL(url));
    });

    WebBrowser.openBrowserAsync(authUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    }).then(() => {
      if (!resolved) {
        subscription.remove();
        reject(new Error("OAuth flow was cancelled"));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Main OAuth flow
// ---------------------------------------------------------------------------

export function isOAuthAvailable(): boolean {
  return Platform.OS !== "web";
}

export async function startOAuthFlow(
  provider: OAuthProviderConfig,
  scopes: string[],
): Promise<OAuthFlowResult> {
  const { clientId, redirectUri } = resolvePlatformOAuth(provider);

  if (!clientId) {
    throw new Error(`No OAuth client configured for provider: ${provider.id}`);
  }
  if (!provider.authorizeUrl) {
    throw new Error(`No OAuth authorize URL for provider: ${provider.id}`);
  }
  if (!provider.tokenUrl) {
    throw new Error(`No OAuth token URL for provider: ${provider.id}`);
  }

  const extraAuthParams: Record<string, string> = provider.extraAuthParams
    ? JSON.parse(provider.extraAuthParams)
    : {};
  const userInfo: UserInfoConfig | undefined = provider.userInfo
    ? JSON.parse(provider.userInfo)
    : undefined;

  // Build scopes
  const defaultScopes = provider.defaultScopes ?? [];
  const allScopes = [
    ...defaultScopes,
    ...scopes.map((s) =>
      provider.scopePrefix ? `${provider.scopePrefix}${s}` : s,
    ),
  ];

  // Generate PKCE
  const { codeVerifier, codeChallenge } = await generatePKCE();

  // Generate state
  const stateBytes = Crypto.getRandomBytes(16);
  const state = toBase64Url(stateBytes);

  // Build authorization URL
  const authUrl = new URL(provider.authorizeUrl);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (allScopes.length > 0) {
    authUrl.searchParams.set("scope", allScopes.join(" "));
  }

  for (const [key, value] of Object.entries(extraAuthParams)) {
    authUrl.searchParams.set(key, value);
  }

  clientLogger.info("Starting OAuth flow", { providerId: provider.id });

  const callbackUrl = await openAuthAndWaitForCallback(
    authUrl.toString(),
    redirectUri,
  );
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
    provider.tokenUrl,
    code,
    redirectUri,
    clientId,
    codeVerifier,
  );

  // Resolve account ID
  const accountId = userInfo
    ? await resolveAccountId(userInfo, tokens)
    : "unknown";

  clientLogger.info("OAuth flow completed", {
    providerId: provider.id,
    accountId,
  });

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
  provider: OAuthProviderConfig,
  scopes: string[],
): Promise<OAuthFlowResult> {
  const { clientId } = resolvePlatformOAuth(provider);
  const result = await startOAuthFlow(provider, scopes);

  await execute(SubmitOAuthConnectionMutation, {
    providerId: provider.id,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
    expiresAt: result.expiresAt ?? null,
    scopes: result.scopes,
    accountId: result.accountId ?? null,
    clientId,
  });

  return result;
}
