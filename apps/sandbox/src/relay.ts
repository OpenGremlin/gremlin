import { existsSync } from "node:fs";
import { homedir } from "node:os";
import pty from "node-pty";
import { type WebSocket, WebSocketServer } from "ws";
import { log } from "./log.js";

const WORKSPACE_DIR = existsSync("/workspace") ? "/workspace" : process.env.SANDBOX_WORKSPACE ?? homedir();
const TOOLS_ROOT = `${WORKSPACE_DIR}/.tools`;

const TOOL_PATHS = [
  `${TOOLS_ROOT}/bin`,
  `${TOOLS_ROOT}/go/bin`,
  `${TOOLS_ROOT}/cargo/bin`,
].join(":");

let connectionCounter = 0;

export function startRelay(port: number): void {
  const wss = new WebSocketServer({ port });

  log("relay", "WebSocket server listening", { port });

  wss.on("connection", (ws: WebSocket, req) => {
    const connId = ++connectionCounter;
    const remoteAddr = req.socket.remoteAddress;

    log("relay", "New WebSocket connection", { connId, remoteAddr });

    // Filter out undefined env values — node-pty's posix_spawnp fails if any are present
    const baseEnv: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined) baseEnv[k] = v;
    }

    const shell = pty.spawn("/bin/bash", [], {
      name: "xterm-256color",
      cols: 120,
      rows: 40,
      cwd: WORKSPACE_DIR,
      env: {
        ...baseEnv,
        TERM: "xterm-256color",
        PATH: `${TOOL_PATHS}:${process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin"}`,
        NPM_CONFIG_PREFIX: TOOLS_ROOT,
        GOPATH: `${TOOLS_ROOT}/go`,
        CARGO_HOME: `${TOOLS_ROOT}/cargo`,
        PYTHONUSERBASE: `${TOOLS_ROOT}/python`,
      },
    });

    log("relay", "PTY spawned", { connId, pid: shell.pid });

    // Signal readiness
    ws.send(JSON.stringify({ type: "ready" }));
    log("relay", "Sent ready signal", { connId });

    // PTY -> WS
    shell.onData((data: string) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    });

    shell.onExit(({ exitCode }) => {
      log("relay", "PTY exited", { connId, exitCode, pid: shell.pid });
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "exit", exitCode }));
        ws.close();
      }
    });

    // WS -> PTY
    ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "input" && typeof msg.data === "string") {
          // Log the command (strip trailing newline for readability)
          const cmd = msg.data.replace(/\n$/, "");
          log("relay", "Input received", {
            connId,
            commandLength: cmd.length,
            commandPreview: cmd.slice(0, 200),
          });
          shell.write(msg.data);
        } else if (msg.type === "resize" && msg.cols && msg.rows) {
          log("relay", "Terminal resized", {
            connId,
            cols: msg.cols,
            rows: msg.rows,
          });
          shell.resize(msg.cols, msg.rows);
        }
      } catch (err) {
        log("relay", "Failed to parse WS message", {
          connId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    ws.on("close", (code, reason) => {
      log("relay", "WebSocket closed", {
        connId,
        code,
        reason: reason.toString(),
      });
      shell.kill();
    });

    ws.on("error", (err) => {
      log("relay", "WebSocket error", {
        connId,
        error: err.message,
      });
    });
  });

  wss.on("error", (err) => {
    log("relay", "WebSocket server error", { error: err.message });
  });
}
