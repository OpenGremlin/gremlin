import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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

    const shellEnv: Record<string, string> = {
      ...baseEnv,
      TERM: "xterm-256color",
      PATH: `${TOOL_PATHS}:${process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin"}`,
      NPM_CONFIG_PREFIX: TOOLS_ROOT,
      GOPATH: `${TOOLS_ROOT}/go`,
      CARGO_HOME: `${TOOLS_ROOT}/cargo`,
      PYTHONUSERBASE: `${TOOLS_ROOT}/python`,
    };

    const shell = pty.spawn("/bin/bash", [], {
      name: "xterm-256color",
      cols: 120,
      rows: 40,
      cwd: WORKSPACE_DIR,
      env: shellEnv,
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
        } else if (msg.type === "exec" && typeof msg.id === "string" && typeof msg.command === "string") {
          handleExec(ws, connId, msg, shellEnv);
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

const MAX_BUFFER_BYTES = 5 * 1024 * 1024; // 5MB hard cap per stream
const MAX_CHUNK_BYTES = 8192; // 8KB per streamed chunk
const MAX_INLINE_BYTES = 50 * 1024; // 50KB — spill to disk above this

function handleExec(
  ws: WebSocket,
  connId: number,
  msg: { id: string; command: string; timeout?: number; env?: Record<string, string> },
  shellEnv: Record<string, string>,
): void {
  const { id, command, timeout, env } = msg;

  log("relay", "Exec command received", {
    connId,
    id,
    commandLength: command.length,
    commandPreview: command.slice(0, 200),
  });

  const proc = spawn("/bin/bash", ["-c", command], {
    cwd: WORKSPACE_DIR,
    env: { ...shellEnv, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let killed = false;

  const timer = setTimeout(() => {
    killed = true;
    proc.kill("SIGKILL");
  }, timeout ?? 120_000);

  proc.stdout.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    if (stdout.length < MAX_BUFFER_BYTES) {
      stdout += text;
    }
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: "exec:output",
        id,
        stream: "stdout",
        data: text.slice(0, MAX_CHUNK_BYTES),
      }));
    }
  });

  proc.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    if (stderr.length < MAX_BUFFER_BYTES) {
      stderr += text;
    }
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: "exec:output",
        id,
        stream: "stderr",
        data: text.slice(0, MAX_CHUNK_BYTES),
      }));
    }
  });

  proc.on("close", (code, signal) => {
    clearTimeout(timer);
    const exitCode = code ?? (signal ? 128 : -1);

    log("relay", "Exec command completed", { connId, id, exitCode, killed });

    if (ws.readyState !== ws.OPEN) return;

    const totalSize = stdout.length + stderr.length;

    if (totalSize > MAX_INLINE_BYTES) {
      const outputPath = `/workspace/.gremlin/output/${id}.txt`;
      try {
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, stdout);
        if (stderr) {
          writeFileSync(`${outputPath}.stderr`, stderr);
        }
      } catch (err) {
        log("relay", "Failed to spill output to disk", {
          connId,
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      ws.send(JSON.stringify({
        type: "exec:done",
        id,
        exitCode,
        stdout: stdout.slice(0, 4096) + "\n...[truncated]...\n" + stdout.slice(-4096),
        stderr: stderr.slice(0, 2048),
        fullOutputPath: outputPath,
        fullOutputBytes: stdout.length,
      }));
    } else {
      ws.send(JSON.stringify({
        type: "exec:done",
        id,
        exitCode,
        stdout,
        stderr,
      }));
    }
  });

  proc.on("error", (err) => {
    clearTimeout(timer);
    log("relay", "Exec command error", { connId, id, error: err.message });

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: "exec:done",
        id,
        exitCode: -1,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        error: err.message,
      }));
    }
  });
}
