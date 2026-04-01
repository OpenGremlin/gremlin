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
let _onTokenChange: ((token: string) => void) | null = null;
let _refreshPromise: Promise<boolean> | null = null;

/** Called by AuthProvider to register a callback for 401 handling. */
export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

/** Called by AuthProvider to sync React state when token is refreshed. */
export function setOnTokenChange(cb: (token: string) => void) {
  _onTokenChange = cb;
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
  if (token) scheduleRefresh(token);
  return token;
}

export function getTokenSync(): string | null {
  return _cachedToken;
}

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

/** Schedule a proactive token refresh ~5 minutes before expiry. */
function scheduleRefresh(token: string) {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresAt = (payload.exp as number) * 1000;
    const delay = expiresAt - Date.now() - 5 * 60 * 1000; // 5 min before expiry
    if (delay > 0) {
      _refreshTimer = setTimeout(() => {
        refreshSession();
      }, delay);
    }
  } catch {
    // malformed token — skip scheduling
  }
}

export async function setToken(t: string): Promise<void> {
  _cachedToken = t;
  await storage.setItem(TOKEN_KEY, t);
  scheduleRefresh(t);
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
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
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
    _onTokenChange?.(data.AuthenticationResult.IdToken);
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
