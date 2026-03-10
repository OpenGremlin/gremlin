import { config, getApiUrl } from "./config";
import { clientLogger } from "./logger";
import { storage } from "./storage";

const TOKEN_KEY = "gremlin_admin_token";

let _cachedToken: string | null = null;

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

export async function clearToken(): Promise<void> {
  _cachedToken = null;
  await storage.deleteItem(TOKEN_KEY);
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
  return { idToken: data.AuthenticationResult.IdToken };
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

export async function gql<TResult>(
  query: { toString(): string },
  variables?: unknown,
): Promise<TResult> {
  const API_URL = getApiUrl();
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: String(query), variables }),
  });
  if (res.status === 401) {
    clientLogger.warn("GraphQL request returned 401, clearing token");
    await clearToken();
    // The auth context will handle the redirect
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
