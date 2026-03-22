import { createHash } from "node:crypto";
import * as arctic from "arctic";

// ---------------------------------------------------------------------------
// Adapter interface — mirrors packages/lib/src/services/oauth/configs.ts
// Duplicated here to avoid pulling in AWS SDK dependencies.
// ---------------------------------------------------------------------------

export interface TokenResult {
  accessToken: string;
  accessTokenExpiresAt?: Date;
  refreshToken?: string;
  idToken?: string;
}

export interface OAuthAdapter {
  createAuthorizationURL(
    state: string,
    codeVerifier: string,
    scopes: string[],
  ): URL;
  validateAuthorizationCode(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResult>;
}

export type UserInfoConfig =
  | { method: "id_token" }
  | {
      method: "rest";
      url: string;
      path: string;
      headers?: Record<string, string>;
      httpMethod?: "GET" | "POST";
    }
  | { method: "graphql"; url: string; query: string; path: string };

export interface DesktopOAuthConfig {
  providerId: string;
  createAdapter: (clientId: string, redirectUri: string) => OAuthAdapter;
  defaultScopes?: string[];
  scopePrefix?: string;
  extraAuthParams?: Record<string, string>;
  userInfo: UserInfoConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapTokens(tokens: arctic.OAuth2Tokens): TokenResult {
  const result: TokenResult = {
    accessToken: tokens.accessToken(),
  };
  try {
    result.accessTokenExpiresAt = tokens.accessTokenExpiresAt();
  } catch {
    /* provider doesn't return expiration */
  }
  if (tokens.hasRefreshToken()) {
    result.refreshToken = tokens.refreshToken();
  }
  try {
    result.idToken = tokens.idToken();
  } catch {
    /* no id_token */
  }
  return result;
}

/**
 * Generate a PKCE code challenge from a code verifier (S256).
 */
function s256Challenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Create an adapter that manually handles PKCE for arctic providers
 * whose API doesn't accept a codeVerifier parameter.
 */
function manualPkceAdapter(
  tokenUrl: string,
  createArcticUrl: (state: string, scopes: string[]) => URL,
  clientId: string,
  redirectUri: string,
): OAuthAdapter {
  return {
    createAuthorizationURL(state, codeVerifier, scopes) {
      const url = createArcticUrl(state, scopes);
      url.searchParams.set("code_challenge", s256Challenge(codeVerifier));
      url.searchParams.set("code_challenge_method", "S256");
      return url;
    },
    async validateAuthorizationCode(code, codeVerifier) {
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
        accessTokenExpiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider configs
// ---------------------------------------------------------------------------

export const desktopOAuthConfigs = new Map<string, DesktopOAuthConfig>([
  [
    "google",
    {
      providerId: "google",
      createAdapter: (id, uri) => {
        const p = new arctic.Google(id, "", uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv)),
        };
      },
      defaultScopes: ["openid", "email"],
      scopePrefix: "https://www.googleapis.com/auth/",
      extraAuthParams: { access_type: "offline", prompt: "consent" },
      userInfo: { method: "id_token" },
    },
  ],
  [
    "linear",
    {
      providerId: "linear",
      createAdapter: (id, uri) =>
        manualPkceAdapter(
          "https://api.linear.app/oauth/token",
          (state, scopes) =>
            new arctic.Linear(id, "", uri).createAuthorizationURL(
              state,
              scopes,
            ),
          id,
          uri,
        ),
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
      createAdapter: (id, uri) => {
        const p = new arctic.Discord(id, "", uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv)),
        };
      },
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
      createAdapter: (id, uri) => {
        const p = new arctic.MicrosoftEntraId("common", id, "", uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv)),
        };
      },
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
      createAdapter: (id, uri) =>
        manualPkceAdapter(
          "https://github.com/login/oauth/access_token",
          (state, scopes) =>
            new arctic.GitHub(id, "", uri).createAuthorizationURL(
              state,
              scopes,
            ),
          id,
          uri,
        ),
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
      createAdapter: (id, uri) =>
        manualPkceAdapter(
          "https://gitlab.com/oauth/token",
          (state, scopes) =>
            new arctic.GitLab(
              "https://gitlab.com",
              id,
              "",
              uri,
            ).createAuthorizationURL(state, scopes),
          id,
          uri,
        ),
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
      createAdapter: (id, uri) =>
        manualPkceAdapter(
          "https://auth.atlassian.com/oauth/token",
          (state, scopes) =>
            new arctic.Atlassian(id, "", uri).createAuthorizationURL(
              state,
              scopes,
            ),
          id,
          uri,
        ),
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
      createAdapter: (id, uri) => {
        const p = new arctic.Spotify(id, "", uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv)),
        };
      },
      userInfo: {
        method: "rest",
        url: "https://api.spotify.com/v1/me",
        path: "email",
      },
    },
  ],
  [
    "dropbox",
    {
      providerId: "dropbox",
      createAdapter: (id, uri) =>
        manualPkceAdapter(
          "https://api.dropboxapi.com/oauth2/token",
          (state, scopes) =>
            new arctic.Dropbox(id, "", uri).createAuthorizationURL(
              state,
              scopes,
            ),
          id,
          uri,
        ),
      extraAuthParams: { token_access_type: "offline" },
      userInfo: {
        method: "rest",
        url: "https://api.dropboxapi.com/2/users/get_current_account",
        path: "email",
        httpMethod: "POST",
      },
    },
  ],
]);
