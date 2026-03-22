import { config, getApiUrl } from "./config";
import { clientLogger } from "./logger";
import { storage } from "./storage";

const TOKEN_KEY = "gremlin_admin_token";
const REFRESH_TOKEN_KEY = "gremlin_refresh_token";
const ACCESS_TOKEN_KEY = "gremlin_access_token";

let _cachedToken: string | null = null;
let _cachedRefreshToken: string | null = null;
let _cachedAccessToken: string | null = null;
let _onUnauthorized: (() => void) | null = null;
let _refreshPromise: Promise<boolean> | null = null;

/** Called by AuthProvider to register a callback for 401 handling. */
export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

export function getCognitoDomain(): string {
  return config.cognitoDomain;
}

export function getCognitoClientId(): string {
  return config.cognitoClientId;
}

export function getCognitoRegion(): string {
  const match = config.cognitoDomain?.match(
    /\.auth\.([^.]+)\.amazoncognito\.com/,
  );
  return match?.[1] ?? "us-east-1";
}

export async function getToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;
  const token = await storage.getItem(TOKEN_KEY);
  _cachedToken = token;
  return token;
}

export function getTokenSync(): string | null {
  return _cachedToken;
}

export async function setToken(t: string): Promise<void> {
  _cachedToken = t;
  await storage.setItem(TOKEN_KEY, t);
}

async function getRefreshToken(): Promise<string | null> {
  if (_cachedRefreshToken) return _cachedRefreshToken;
  const token = await storage.getItem(REFRESH_TOKEN_KEY);
  _cachedRefreshToken = token;
  return token;
}

async function setRefreshToken(t: string): Promise<void> {
  _cachedRefreshToken = t;
  await storage.setItem(REFRESH_TOKEN_KEY, t);
}

async function getAccessToken(): Promise<string | null> {
  if (_cachedAccessToken) return _cachedAccessToken;
  const token = await storage.getItem(ACCESS_TOKEN_KEY);
  _cachedAccessToken = token;
  return token;
}

async function setAccessToken(t: string): Promise<void> {
  _cachedAccessToken = t;
  await storage.setItem(ACCESS_TOKEN_KEY, t);
}

export async function clearToken(): Promise<void> {
  _cachedToken = null;
  _cachedRefreshToken = null;
  _cachedAccessToken = null;
  await Promise.all([
    storage.deleteItem(TOKEN_KEY),
    storage.deleteItem(REFRESH_TOKEN_KEY),
    storage.deleteItem(ACCESS_TOKEN_KEY),
  ]);
}

export function isAuthEnabled(): boolean {
  if (config.skipAuth) return false;
  return !!config.cognitoDomain;
}

const cognitoEndpoint = () =>
  `https://cognito-idp.${getCognitoRegion()}.amazonaws.com/`;

export async function cognitoLogin(
  email: string,
  password: string,
): Promise<{ idToken: string }> {
  const res = await fetch(cognitoEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: getCognitoClientId(),
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  });
  const data = await res.json();
  if (data.__type) {
    const message =
      data.message ?? data.__type.split("#").pop() ?? "Login failed";
    throw new Error(message);
  }
  const result = data.AuthenticationResult;
  if (result.RefreshToken) {
    await setRefreshToken(result.RefreshToken);
  }
  if (result.AccessToken) {
    await setAccessToken(result.AccessToken);
  }
  return { idToken: result.IdToken };
}

/**
 * Attempt to refresh the session using the stored refresh token.
 * Returns true if successful (new ID token stored), false otherwise.
 * Deduplicates concurrent refresh attempts.
 */
export async function refreshSession(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefresh();
  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

async function _doRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(cognitoEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: getCognitoClientId(),
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    });
    const data = await res.json();
    if (data.__type || !data.AuthenticationResult?.IdToken) {
      clientLogger.warn("Token refresh failed", {
        error: data.__type ?? "no id token",
      });
      return false;
    }
    await setToken(data.AuthenticationResult.IdToken);
    if (data.AuthenticationResult.AccessToken) {
      await setAccessToken(data.AuthenticationResult.AccessToken);
    }
    clientLogger.info("Token refreshed successfully");
    return true;
  } catch (err) {
    clientLogger.error("Token refresh error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function cognitoSignup(
  email: string,
  password: string,
): Promise<{ userConfirmed: boolean }> {
  const res = await fetch(cognitoEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
    },
    body: JSON.stringify({
      ClientId: getCognitoClientId(),
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    }),
  });
  const data = await res.json();
  if (data.__type) {
    const message =
      data.message ?? data.__type.split("#").pop() ?? "Signup failed";
    throw new Error(message);
  }
  return { userConfirmed: data.UserConfirmed };
}

export async function cognitoConfirmSignup(
  email: string,
  code: string,
): Promise<void> {
  const res = await fetch(cognitoEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp",
    },
    body: JSON.stringify({
      ClientId: getCognitoClientId(),
      Username: email,
      ConfirmationCode: code,
    }),
  });
  const data = await res.json();
  if (data.__type) {
    const message =
      data.message ?? data.__type.split("#").pop() ?? "Confirmation failed";
    throw new Error(message);
  }
}

export async function cognitoChangePassword(
  previousPassword: string,
  proposedPassword: string,
): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(cognitoEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.ChangePassword",
    },
    body: JSON.stringify({
      AccessToken: accessToken,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword,
    }),
  });
  const data = await res.json();
  if (data.__type) {
    const message =
      data.message ?? data.__type.split("#").pop() ?? "Password change failed";
    throw new Error(message);
  }
}

export async function gql<TResult, TVariables>(
  query: import("../graphql/generated/graphql").TypedDocumentString<
    TResult,
    TVariables
  >,
  ...args: Record<string, never> extends TVariables
    ? [variables?: TVariables]
    : [variables: TVariables]
): Promise<TResult>;
export async function gql(
  query: { toString(): string },
  variables?: unknown,
): Promise<unknown> {
  const result = await _gqlRequest(query, variables);
  return result;
}

async function _gqlRequest(
  query: { toString(): string },
  variables?: unknown,
): Promise<unknown> {
  const API_URL = getApiUrl();
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const body = JSON.stringify({ query: String(query), variables });
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers,
    body,
  });
  if (res.status === 401) {
    clientLogger.warn("GraphQL request returned 401, attempting refresh");
    const refreshed = await refreshSession();
    if (refreshed) {
      // Retry with the new token
      const newToken = await getToken();
      const retryRes = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        body,
      });
      if (retryRes.status === 401) {
        clientLogger.warn("Retry after refresh still 401, logging out");
        await clearToken();
        _onUnauthorized?.();
        throw new Error("Unauthorized");
      }
      const retryJson = await retryRes.json();
      if (retryJson.errors) {
        throw new Error(retryJson.errors[0].message);
      }
      return retryJson.data;
    }
    // Refresh failed — clear and redirect to login
    clientLogger.warn("Token refresh failed, logging out");
    await clearToken();
    _onUnauthorized?.();
    throw new Error("Unauthorized");
  }
  const json = await res.json();
  if (json.errors) {
    clientLogger.error("GraphQL error", {
      error: json.errors[0].message,
    });
    throw new Error(json.errors[0].message);
  }
  return json.data;
}
