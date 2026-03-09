const runtimeConfig = (window as unknown as Record<string, unknown>)
  .__GREMLIN_CONFIG__ as
  | { cognitoDomain?: string; cognitoClientId?: string; apiUrl?: string }
  | undefined;

const COGNITO_DOMAIN =
  runtimeConfig?.cognitoDomain ||
  (import.meta.env.VITE_COGNITO_DOMAIN as string);
const COGNITO_CLIENT_ID =
  runtimeConfig?.cognitoClientId ||
  (import.meta.env.VITE_COGNITO_CLIENT_ID as string);
const API_URL =
  runtimeConfig?.apiUrl || (import.meta.env.VITE_API_URL as string) || "";

const TOKEN_KEY = "gremlin_admin_token";

export function getCognitoDomain(): string {
  return COGNITO_DOMAIN;
}

export function getCognitoClientId(): string {
  return COGNITO_CLIENT_ID;
}

export function getCognitoRegion(): string {
  // Extract region from domain: "prefix.auth.us-east-1.amazoncognito.com"
  const match = COGNITO_DOMAIN?.match(/\.auth\.([^.]+)\.amazoncognito\.com/);
  return match?.[1] ?? "us-east-1";
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string): void {
  sessionStorage.setItem(TOKEN_KEY, t);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthEnabled(): boolean {
  if (import.meta.env.VITE_SKIP_AUTH === "true") return false;
  return !!COGNITO_DOMAIN;
}

export function extractTokenFromHash(): string | null {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("id_token");
}

// Cognito USER_SRP_AUTH is complex; use USER_PASSWORD_AUTH via the public API
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
      ClientId: COGNITO_CLIENT_ID,
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
      ClientId: COGNITO_CLIENT_ID,
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
      ClientId: COGNITO_CLIENT_ID,
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
  const { clientLogger } = await import("./logger");
  const token = getToken();
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
    clearToken();
    window.location.reload();
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
