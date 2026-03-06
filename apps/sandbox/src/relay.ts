import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import pty from "node-pty";
import { type WebSocket, WebSocketServer } from "ws";
import { createLogger } from "./log.js";

const log = createLogger("relay");

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

  log.info({ port }, "WebSocket server listening");

  wss.on("connection", (ws: WebSocket, req) => {
    const connId = ++connectionCounter;
    const remoteAddr = req.socket.remoteAddress;

    log.info({ connId, remoteAddr }, "New WebSocket connection");

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

    log.info({ connId, pid: shell.pid }, "PTY spawned");

    // Signal readiness
    ws.send(JSON.stringify({ type: "ready" }));
    log.debug({ connId }, "Sent ready signal");

    // PTY -> WS
    shell.onData((data: string) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    });

    shell.onExit(({ exitCode }) => {
      log.info({ connId, exitCode, pid: shell.pid }, "PTY exited");
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "exit", exitCode }));
        ws.close();
      }
    });

    // Per-connection shell state for exec mode
    const execState = { cwd: WORKSPACE_DIR, env: {} as Record<string, string> };

    // WS -> PTY
    ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "input" && typeof msg.data === "string") {
          const cmd = msg.data.replace(/\n$/, "");
          log.debug({
            connId,
            commandLength: cmd.length,
            commandPreview: cmd.slice(0, 200),
          }, "Input received");
          shell.write(msg.data);
        } else if (msg.type === "resize" && msg.cols && msg.rows) {
          log.debug({ connId, cols: msg.cols, rows: msg.rows }, "Terminal resized");
          shell.resize(msg.cols, msg.rows);
        } else if (msg.type === "exec" && typeof msg.id === "string" && typeof msg.command === "string") {
          handleExec(ws, connId, msg, shellEnv, execState);
        }
      } catch (err) {
        log.warn({
          connId,
          err,
        }, "Failed to parse WS message");
      }
    });

    ws.on("close", (code, reason) => {
      log.info({ connId, code, reason: reason.toString() }, "WebSocket closed");
      shell.kill();
    });

    ws.on("error", (err) => {
      log.error({ connId, err }, "WebSocket error");
    });
  });

  wss.on("error", (err) => {
    log.error({ err }, "WebSocket server error");
  });
}

const MAX_BUFFER_BYTES = 5 * 1024 * 1024; // 5MB hard cap per stream
const MAX_CHUNK_BYTES = 8192; // 8KB per streamed chunk
const MAX_INLINE_BYTES = 50 * 1024; // 50KB — spill to disk above this

const CWD_SENTINEL = "__GREMLIN_CWD__";

interface ExecState {
  cwd: string;
  env: Record<string, string>;
}

function handleExec(
  ws: WebSocket,
  connId: number,
  msg: { id: string; command: string; timeout?: number; env?: Record<string, string> },
  shellEnv: Record<string, string>,
  execState: ExecState,
): void {
  const { id, command, timeout, env } = msg;

  log.info({
    connId,
    id,
    commandLength: command.length,
    commandPreview: command.slice(0, 200),
    cwd: execState.cwd,
  }, "Exec command received");

  // Wrap command to capture cwd after execution
  const wrappedCommand = `${command}\n__gremlin_exit=$?; echo "${CWD_SENTINEL}" >&2; pwd >&2; exit $__gremlin_exit`;

  const proc = spawn("/bin/bash", ["-c", wrappedCommand], {
    cwd: execState.cwd,
    env: { ...shellEnv, ...execState.env, ...env },
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

    // Extract cwd from stderr sentinel and update exec state
    const cwdIdx = stderr.lastIndexOf(CWD_SENTINEL);
    if (cwdIdx !== -1) {
      const afterSentinel = stderr.slice(cwdIdx + CWD_SENTINEL.length).trim();
      const newCwd = afterSentinel.split("\n")[0]?.trim();
      if (newCwd && newCwd.startsWith("/")) {
        execState.cwd = newCwd;
      }
      // Strip the sentinel and cwd from stderr
      stderr = stderr.slice(0, cwdIdx).trimEnd();
    }

    log.info({ connId, id, exitCode, killed, cwd: execState.cwd }, "Exec command completed");

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
        log.error({ connId, id, err }, "Failed to spill output to disk");
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
    log.error({ connId, id, err }, "Exec command error");

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
