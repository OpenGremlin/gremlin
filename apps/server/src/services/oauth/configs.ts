import * as arctic from "arctic";

// ---------------------------------------------------------------------------
// Adapter interface — normalizes Arctic providers into a uniform API
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
  refreshAccessToken?(refreshToken: string): Promise<TokenResult>;
}

// ---------------------------------------------------------------------------
// User-info resolution
// ---------------------------------------------------------------------------

export type UserInfoConfig =
  | { method: "id_token" }
  | {
      method: "rest";
      url: string;
      path: string;
      headers?: Record<string, string>;
    }
  | { method: "graphql"; url: string; query: string; path: string };

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

export interface OAuthProviderConfig {
  providerId: string;
  createAdapter: (
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ) => OAuthAdapter;
  /** Whether to generate + store a PKCE code verifier */
  pkce: boolean;
  defaultScopes?: string[];
  /** Prefix applied to user-selected scopes (not to defaultScopes) */
  scopePrefix?: string;
  extraAuthParams?: Record<string, string>;
  userInfo: UserInfoConfig;
  secretId: string;
  redirectUriEnvVar: string;
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

export const oauthConfigs = new Map<string, OAuthProviderConfig>([
  // ── Google ────────────────────────────────────────────────────────────
  [
    "google",
    {
      providerId: "google",
      createAdapter: (id, secret, uri) => {
        const p = new arctic.Google(id, secret, uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv!, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv!)),
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: true,
      defaultScopes: ["openid", "email"],
      scopePrefix: "https://www.googleapis.com/auth/",
      extraAuthParams: { access_type: "offline", prompt: "consent" },
      userInfo: { method: "id_token" },
      secretId: "gremlin/google-oauth",
      redirectUriEnvVar: "GOOGLE_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Notion ────────────────────────────────────────────────────────────
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
          // Notion tokens don't expire and can't be refreshed
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
      secretId: "gremlin/notion-oauth",
      redirectUriEnvVar: "NOTION_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Linear ────────────────────────────────────────────────────────────
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
          // Linear tokens don't support refresh
        };
      },
      pkce: false,
      userInfo: {
        method: "graphql",
        url: "https://api.linear.app/graphql",
        query: "{ viewer { email } }",
        path: "data.viewer.email",
      },
      secretId: "gremlin/linear-oauth",
      redirectUriEnvVar: "LINEAR_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Discord ───────────────────────────────────────────────────────────
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
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: false,
      defaultScopes: ["identify", "email"],
      userInfo: {
        method: "rest",
        url: "https://discord.com/api/users/@me",
        path: "email",
      },
      secretId: "gremlin/discord-oauth",
      redirectUriEnvVar: "DISCORD_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Microsoft Teams (Entra ID) ────────────────────────────────────────
  [
    "teams",
    {
      providerId: "teams",
      createAdapter: (id, secret, uri) => {
        const p = new arctic.MicrosoftEntraId("common", id, secret, uri);
        return {
          createAuthorizationURL: (state, cv, scopes) =>
            p.createAuthorizationURL(state, cv!, scopes),
          validateAuthorizationCode: async (code, cv) =>
            wrapTokens(await p.validateAuthorizationCode(code, cv!)),
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt, [])),
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
      secretId: "gremlin/teams-oauth",
      redirectUriEnvVar: "TEAMS_OAUTH_REDIRECT_URI",
    },
  ],

  // ── GitHub ────────────────────────────────────────────────────────────
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
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: false,
      userInfo: {
        method: "rest",
        url: "https://api.github.com/user",
        path: "login",
      },
      secretId: "gremlin/github-oauth",
      redirectUriEnvVar: "GITHUB_OAUTH_REDIRECT_URI",
    },
  ],

  // ── GitLab ────────────────────────────────────────────────────────────
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
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: false,
      userInfo: {
        method: "rest",
        url: "https://gitlab.com/api/v4/user",
        path: "email",
      },
      secretId: "gremlin/gitlab-oauth",
      redirectUriEnvVar: "GITLAB_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Jira (Atlassian) ─────────────────────────────────────────────────
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
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: false,
      extraAuthParams: { audience: "api.atlassian.com", prompt: "consent" },
      userInfo: {
        method: "rest",
        url: "https://api.atlassian.com/me",
        path: "email",
      },
      secretId: "gremlin/jira-oauth",
      redirectUriEnvVar: "JIRA_OAUTH_REDIRECT_URI",
    },
  ],

  // ── Spotify ───────────────────────────────────────────────────────────
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
          refreshAccessToken: async (rt) =>
            wrapTokens(await p.refreshAccessToken(rt)),
        };
      },
      pkce: false,
      userInfo: {
        method: "rest",
        url: "https://api.spotify.com/v1/me",
        path: "email",
      },
      secretId: "gremlin/spotify-oauth",
      redirectUriEnvVar: "SPOTIFY_OAUTH_REDIRECT_URI",
    },
  ],
]);
