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
const REDIRECT_URI =
  (import.meta.env.VITE_REDIRECT_URI as string) || window.location.origin;
const API_URL =
  runtimeConfig?.apiUrl || (import.meta.env.VITE_API_URL as string) || "";

const TOKEN_KEY = "gremlin_admin_token";

export function getLoginUrl(): string {
  return `https://${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=openid+email&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

export function getLogoutUrl(): string {
  return `https://${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

export function extractTokenFromHash(): string | null {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("id_token");
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
    clientLogger.warn("GraphQL request returned 401, redirecting to login");
    clearToken();
    window.location.href = getLoginUrl();
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
