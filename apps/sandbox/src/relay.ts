import pty from "node-pty";
import { type WebSocket, WebSocketServer } from "ws";

const TOOLS_ROOT = "/workspace/.tools";

const TOOL_PATHS = [
  `${TOOLS_ROOT}/bin`,
  `${TOOLS_ROOT}/go/bin`,
  `${TOOLS_ROOT}/cargo/bin`,
].join(":");

export function startRelay(port: number): void {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws: WebSocket) => {
    const shell = pty.spawn("bash", [], {
      name: "xterm-256color",
      cols: 120,
      rows: 40,
      cwd: "/workspace",
      env: {
        ...process.env,
        TERM: "xterm-256color",
        PATH: `${TOOL_PATHS}:${process.env.PATH ?? ""}`,
        NPM_CONFIG_PREFIX: TOOLS_ROOT,
        GOPATH: `${TOOLS_ROOT}/go`,
        CARGO_HOME: `${TOOLS_ROOT}/cargo`,
        PYTHONUSERBASE: `${TOOLS_ROOT}/python`,
      } as Record<string, string>,
    });

    // Signal readiness
    ws.send(JSON.stringify({ type: "ready" }));

    // PTY -> WS
    shell.onData((data: string) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    });

    shell.onExit(({ exitCode }) => {
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
          shell.write(msg.data);
        } else if (msg.type === "resize" && msg.cols && msg.rows) {
          shell.resize(msg.cols, msg.rows);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      shell.kill();
    });
  });
}
