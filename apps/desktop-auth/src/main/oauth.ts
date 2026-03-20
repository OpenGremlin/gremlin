import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { decodeIdToken } from "arctic";
import { REDIRECT_PORT, startCallbackServer } from "./callback-server.js";
import {
  desktopOAuthConfigs,
  type TokenResult,
  type UserInfoConfig,
} from "./oauth-configs.js";

const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

interface OAuthFlowConfig {
  providerId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface OAuthFlowResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  scopes: string[];
}

function getNestedValue(obj: unknown, path: string): unknown {
  let current = obj;
  for (const part of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

async function resolveAccountId(
  userInfo: UserInfoConfig,
  tokens: TokenResult,
): Promise<string> {
  switch (userInfo.method) {
    case "id_token": {
      if (!tokens.idToken) return "unknown";
      const claims = decodeIdToken(tokens.idToken) as { email?: string };
      return claims.email ?? "unknown";
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
}

export async function handleOAuthFlow(
  config: OAuthFlowConfig,
): Promise<OAuthFlowResult> {
  const providerConfig = desktopOAuthConfigs.get(config.providerId);
  if (!providerConfig) {
    throw new Error(`No OAuth config for provider: ${config.providerId}`);
  }

  const adapter = providerConfig.createAdapter(
    config.clientId,
    config.clientSecret,
    REDIRECT_URI,
  );

  // Build scopes
  const allScopes = [
    ...(providerConfig.defaultScopes ?? []),
    ...config.scopes.map((s) =>
      providerConfig.scopePrefix ? `${providerConfig.scopePrefix}${s}` : s,
    ),
  ];

  // Generate PKCE verifier if needed
  const codeVerifier = providerConfig.pkce
    ? randomBytes(32).toString("base64url")
    : null;

  // Generate state
  const state = randomBytes(16).toString("base64url");

  // Create authorization URL
  const authUrl = adapter.createAuthorizationURL(
    state,
    codeVerifier,
    allScopes,
  );

  // Add extra auth params
  if (providerConfig.extraAuthParams) {
    for (const [key, value] of Object.entries(providerConfig.extraAuthParams)) {
      authUrl.searchParams.set(key, value);
    }
  }

  // Start local callback server and wait for the code
  const code = await startCallbackServer<string>({
    authUrl: authUrl.toString(),
    handler(
      req: IncomingMessage,
      res: ServerResponse,
      resolve,
      reject,
      cleanup,
    ) {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${REDIRECT_PORT}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const reqCode = url.searchParams.get("code");
      const reqState = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><h2>Authorization failed. You can close this tab.</h2></body></html>",
        );
        cleanup();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!reqCode || reqState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><h2>Invalid callback. You can close this tab.</h2></body></html>",
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body style='background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><h2>Authorization successful! You can close this tab.</h2></body></html>",
      );
      cleanup();
      resolve(reqCode);
    },
  });

  // Exchange code for tokens
  const tokens = await adapter.validateAuthorizationCode(code, codeVerifier);

  // Resolve account ID
  const accountId = await resolveAccountId(providerConfig.userInfo, tokens);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.accessTokenExpiresAt?.toISOString(),
    accountId,
    scopes: config.scopes,
  };
}
