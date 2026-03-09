import { randomBytes } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import { shell } from "electron";

const REDIRECT_PORT = 19284;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/cognito-callback`;
const TIMEOUT_MS = 5 * 60 * 1000;

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

  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname === "/cognito-callback" && req.method === "GET") {
        // Serve a page that extracts the id_token from the hash fragment
        // and forwards it to /cognito-token as a query param
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
    });

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Cognito login timed out (5 minutes)"));
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeout);
      server.close();
    }

    server.listen(REDIRECT_PORT, () => {
      shell.openExternal(loginUrl);
    });

    server.on("error", (err) => {
      cleanup();
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
  });
}
