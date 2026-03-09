import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { REDIRECT_PORT, startCallbackServer } from "./callback-server.js";

const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/cognito-callback`;

interface CognitoLoginConfig {
  cognitoDomain: string;
  clientId: string;
}

/**
 * Opens the Cognito hosted UI in the system browser and captures the id_token
 * via a local HTTP callback server.
 *
 * The implicit grant returns tokens in the URL hash fragment, which is not
 * sent to the server. So we serve a small HTML page that extracts the token
 * from the hash and forwards it to a second endpoint as a query parameter.
 */
export function handleCognitoLogin(
  config: CognitoLoginConfig,
): Promise<string> {
  const nonce = randomBytes(16).toString("base64url");

  const loginUrl = `https://${config.cognitoDomain}/login?client_id=${config.clientId}&response_type=token&scope=openid+email&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&nonce=${nonce}`;

  return startCallbackServer<string>({
    authUrl: loginUrl,
    handler(
      req: IncomingMessage,
      res: ServerResponse,
      resolve,
      _reject,
      cleanup,
    ) {
      const url = new URL(req.url ?? "/", `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname === "/cognito-callback" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<h2 id="msg">Completing login...</h2>
<script>
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('id_token');
  const error = params.get('error');
  if (error) {
    document.getElementById('msg').textContent = 'Login failed: ' + error + '. You can close this tab.';
  } else if (token) {
    fetch('/cognito-token?token=' + encodeURIComponent(token))
      .then(() => { document.getElementById('msg').textContent = 'Login successful! You can close this tab.'; })
      .catch(() => { document.getElementById('msg').textContent = 'Failed to send token. You can close this tab.'; });
  } else {
    document.getElementById('msg').textContent = 'No token received. You can close this tab.';
  }
</script>
</body>
</html>`);
        return;
      }

      if (url.pathname === "/cognito-token" && req.method === "GET") {
        const token = url.searchParams.get("token");
        if (token) {
          res.writeHead(200, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": `http://localhost:${REDIRECT_PORT}`,
          });
          res.end("OK");
          cleanup();
          resolve(token);
          return;
        }
        res.writeHead(400);
        res.end("Missing token");
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    },
  });
}
