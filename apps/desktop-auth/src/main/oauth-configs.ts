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
    codeVerifier: string | null,
    scopes: string[],
  ): URL;
  validateAuthorizationCode(
    code: string,
    codeVerifier: string | null,
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
  createAdapter: (
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ) => OAuthAdapter;
  pkce: boolean;
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

// ---------------------------------------------------------------------------
// Provider configs
// ---------------------------------------------------------------------------

export const desktopOAuthConfigs = new Map<string, DesktopOAuthConfig>([
  [
    "google",
    {
      providerId: "google",
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Google(id, secret, uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv ?? "", scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv ?? "")),
        };
      },
      pkce: true,
      defaultScopes: ["openid", "email"],
      scopePrefix: "https://www.googleapis.com/auth/",
      extraAuthParams: { access_type: "offline", prompt: "consent" },
      userInfo: { method: "id_token" },
    },
  ],
  [
    "notion",
    {
      providerId: "notion",
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Notion(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, _scopes) =>
            p.createAuthorizationURL(state),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
      pkce: false,
      extraAuthParams: { owner: "user" },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Linear(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Discord(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, null, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, null)),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.MicrosoftEntraId("common", id, secret, uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv ?? "", scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv ?? "")),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.GitHub(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.GitLab("https://gitlab.com", id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Atlassian(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Spotify(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, null, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, null)),
        };
      },
      pkce: false,
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
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Dropbox(id, secret, uri);
        return {
          createAuthorizationURL: (state, _cv, scopes) =>
            p.createAuthorizationURL(state, scopes),
          validateAuthorizationCode: async (code, _cv) =>
            wrapTokens(await p.validateAuthorizationCode(code)),
        };
      },
      pkce: false,
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
