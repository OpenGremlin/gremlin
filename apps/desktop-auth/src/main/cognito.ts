import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { net } from "electron";
import { REDIRECT_PORT, startCallbackServer } from "./callback-server.js";

const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/cognito-callback`;

interface CognitoLoginConfig {
  cognitoDomain: string;
  clientId: string;
}

export interface CognitoTokenResult {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/**
 * Opens the Cognito hosted UI using the authorization code flow with PKCE,
 * exchanges the code for tokens, and returns an id_token + refresh_token.
 */
export function handleCognitoLogin(
  config: CognitoLoginConfig,
): Promise<CognitoTokenResult> {
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  const nonce = randomBytes(16).toString("base64url");

  const loginUrl = `https://${config.cognitoDomain}/oauth2/authorize?client_id=${config.clientId}&response_type=code&scope=openid+email&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&nonce=${nonce}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return startCallbackServer<CognitoTokenResult>({
    authUrl: loginUrl,
    handler(
      req: IncomingMessage,
      res: ServerResponse,
      resolve,
      reject,
      cleanup,
    ) {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${REDIRECT_PORT}`);

      if (url.pathname === "/cognito-callback" && req.method === "GET") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            resultPage(`Login failed: ${error}. You can close this tab.`),
          );
          cleanup();
          reject(new Error(`Cognito login error: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            resultPage(
              "No authorization code received. You can close this tab.",
            ),
          );
          cleanup();
          reject(new Error("No authorization code received"));
          return;
        }

        // Exchange code for tokens
        exchangeCode(config, code, codeVerifier)
          .then((result) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(resultPage("Login successful! You can close this tab."));
            cleanup();
            resolve(result);
          })
          .catch((err) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(
              resultPage("Token exchange failed. You can close this tab."),
            );
            cleanup();
            reject(err);
          });
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    },
  });
}

async function exchangeCode(
  config: CognitoLoginConfig,
  code: string,
  codeVerifier: string,
): Promise<CognitoTokenResult> {
  const tokenUrl = `https://${config.cognitoDomain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await net.fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

/**
 * Refresh the Cognito session using a refresh token.
 * Returns a new id_token and its expiry.
 */
export async function refreshCognitoToken(
  cognitoDomain: string,
  clientId: string,
  refreshToken: string,
): Promise<{ idToken: string; expiresIn: number }> {
  const tokenUrl = `https://${cognitoDomain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const res = await net.fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    idToken: data.id_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

function resultPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<h2>${message}</h2>
</body>
</html>`;
}
