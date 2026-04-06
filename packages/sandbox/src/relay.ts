import { execSync, spawn } from "node:child_process";
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import * as pty from "node-pty";
import { type WebSocket, WebSocketServer } from "ws";
import { createLogger } from "./log.js";

const log = createLogger("relay");

const isLocal = process.env.SANDBOX_LOCAL === "true";
const WORKSPACE_DIR = existsSync("/workspace")
  ? "/workspace"
  : (process.env.SANDBOX_WORKSPACE ?? homedir());
const SANDBOX_USER = process.env.SANDBOX_USER ?? (isLocal ? "root" : "sandbox");
const SANDBOX_HOME =
  SANDBOX_USER === "root" ? homedir() : `/home/${SANDBOX_USER}`;
const TOOLS_ROOT = `${SANDBOX_HOME}/.tools`;

// Resolve UID/GID for the sandbox user (relay runs as root, shell drops privileges)
function resolveUser(
  username: string,
): { uid: number; gid: number } | undefined {
  if (username === "root") return undefined;
  const lines = execSync(`id -u ${username} && id -g ${username}`, {
    encoding: "utf-8",
  })
    .trim()
    .split("\n");
  const uid = Number(lines[0]);
  const gid = Number(lines[1]);
  if (Number.isNaN(uid) || Number.isNaN(gid)) {
    throw new Error(`Failed to resolve uid/gid for user "${username}"`);
  }
  return { uid, gid };
}
const sandboxIds = resolveUser(SANDBOX_USER);
log.info({ SANDBOX_USER, sandboxIds }, "Resolved sandbox user");

const TOOL_PATHS = [
  `${TOOLS_ROOT}/bin`,
  `${TOOLS_ROOT}/go/bin`,
  `${TOOLS_ROOT}/cargo/bin`,
].join(":");

// Filter out undefined env values — node-pty's posix_spawnp fails if any are present
const baseEnv: Record<string, string> = {};
for (const [k, v] of Object.entries(process.env)) {
  if (v !== undefined) baseEnv[k] = v;
}

const shellEnv: Record<string, string> = {
  ...baseEnv,
  TERM: "xterm-256color",
  HOME: SANDBOX_HOME,
  USER: SANDBOX_USER,
  PATH: `${TOOL_PATHS}:${process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin"}`,
  NPM_CONFIG_PREFIX: TOOLS_ROOT,
  GOPATH: `${TOOLS_ROOT}/go`,
  CARGO_HOME: `${TOOLS_ROOT}/cargo`,
  PYTHONUSERBASE: `${TOOLS_ROOT}/python`,
};

let connectionCounter = 0;

export function startRelay(port: number): void {
  const wss = new WebSocketServer({ port });

  log.info({ port }, "WebSocket server listening");

  wss.on("connection", (ws: WebSocket, req) => {
    const connId = ++connectionCounter;
    const remoteAddr = req.socket.remoteAddress;

    log.info({ connId, remoteAddr }, "New WebSocket connection");

    const shell = pty.spawn("/bin/bash", [], {
      name: "xterm-256color",
      cols: 120,
      rows: 40,
      cwd: WORKSPACE_DIR,
      env: shellEnv,
      ...(sandboxIds && { uid: sandboxIds.uid, gid: sandboxIds.gid }),
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
          log.debug(
            {
              connId,
              commandLength: cmd.length,
              commandPreview: cmd.slice(0, 200),
            },
            "Input received",
          );
          shell.write(msg.data);
        } else if (msg.type === "resize" && msg.cols && msg.rows) {
          log.debug(
            { connId, cols: msg.cols, rows: msg.rows },
            "Terminal resized",
          );
          shell.resize(msg.cols, msg.rows);
        } else if (
          msg.type === "exec" &&
          typeof msg.id === "string" &&
          typeof msg.command === "string"
        ) {
          handleExec(ws, connId, msg, shellEnv, execState);
        } else if (
          msg.type === "readOutput" &&
          typeof msg.commandId === "string"
        ) {
          handleReadOutput(ws, connId, msg);
        }
      } catch (err) {
        log.warn(
          {
            connId,
            err,
          },
          "Failed to parse WS message",
        );
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

const MAX_CHUNK_BYTES = 8192; // 8KB per streamed chunk
const MAX_INLINE_BYTES = 50 * 1024; // 50KB — spill to disk above this

import { HeadTailBuffer } from "./headTailBuffer.js";

/** Half-size for each of head and tail in the HeadTailBuffer. */
const HALF_BUFFER_BYTES = 512 * 1024; // 512KB each → 1MB total max per stream

/**
 * Threshold (chars) above which output is streamed to disk so that
 * readCommandOutput can page through the full version later.
 * Matches the client-side MAX_OUTPUT_CHARS.
 */
const PERSIST_THRESHOLD = 20_000;

/**
 * Lazily writes stream data to disk once total size exceeds PERSIST_THRESHOLD.
 * Ensures the on-disk file always contains the full, untruncated output even
 * when the in-memory HeadTailBuffer has dropped the middle.
 */
class DiskSpiller {
  private fd: number | null = null;
  private _totalBytes = 0;
  private buffered = "";
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  append(text: string): void {
    this._totalBytes += text.length;

    if (this.fd !== null) {
      // Already spilling — write directly
      appendFileSync(this.fd, text);
      return;
    }

    // Buffer until threshold
    this.buffered += text;
    if (this._totalBytes > PERSIST_THRESHOLD) {
      this.open();
    }
  }

  get totalBytes(): number {
    return this._totalBytes;
  }

  get active(): boolean {
    return this.fd !== null;
  }

  close(): void {
    if (this.fd !== null) {
      closeSync(this.fd);
      this.fd = null;
    }
    this.buffered = "";
  }

  private open(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    this.fd = openSync(this.filePath, "w");
    // Flush buffered content
    if (this.buffered) {
      appendFileSync(this.fd, this.buffered);
      this.buffered = "";
    }
  }
}

const CWD_SENTINEL = "__GREMLIN_CWD__";

interface ExecState {
  cwd: string;
  env: Record<string, string>;
}

function handleExec(
  ws: WebSocket,
  connId: number,
  msg: {
    id: string;
    command: string;
    timeout?: number;
    env?: Record<string, string>;
  },
  shellEnv: Record<string, string>,
  execState: ExecState,
): void {
  const { id, command, timeout, env } = msg;

  log.info(
    {
      connId,
      id,
      commandLength: command.length,
      commandPreview: command.slice(0, 200),
      cwd: execState.cwd,
      envKeysFromMessage: env ? Object.keys(env) : [],
      execStateEnvKeys: Object.keys(execState.env),
    },
    "Exec command received",
  );

  // Wrap command to capture cwd after execution
  const wrappedCommand = `${command}\n__gremlin_exit=$?; echo "${CWD_SENTINEL}" >&2; pwd >&2; exit $__gremlin_exit`;

  const proc = spawn("/bin/bash", ["-c", wrappedCommand], {
    cwd: execState.cwd,
    env: { ...shellEnv, ...execState.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    ...(sandboxIds && { uid: sandboxIds.uid, gid: sandboxIds.gid }),
  });

  const stdoutBuf = new HeadTailBuffer(HALF_BUFFER_BYTES);
  const stderrBuf = new HeadTailBuffer(HALF_BUFFER_BYTES);
  const outputDir = `${homedir()}/.gremlin/output`;
  const stdoutSpiller = new DiskSpiller(`${outputDir}/${id}.txt`);
  const stderrSpiller = new DiskSpiller(`${outputDir}/${id}.txt.stderr`);
  let killed = false;

  const timer = setTimeout(() => {
    killed = true;
    proc.kill("SIGKILL");
  }, timeout ?? 120_000);

  proc.stdout.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    stdoutBuf.append(text);
    stdoutSpiller.append(text);
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: "exec:output",
          id,
          stream: "stdout",
          data: text.slice(0, MAX_CHUNK_BYTES),
        }),
      );
    }
  });

  proc.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    stderrBuf.append(text);
    stderrSpiller.append(text);
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: "exec:output",
          id,
          stream: "stderr",
          data: text.slice(0, MAX_CHUNK_BYTES),
        }),
      );
    }
  });

  proc.on("close", (code, signal) => {
    clearTimeout(timer);
    const exitCode = code ?? (signal ? 128 : -1);

    // Materialize buffered output
    const stdout = stdoutBuf.toString();
    let stderr = stderrBuf.toString();

    // Extract cwd from stderr sentinel and update exec state
    const cwdIdx = stderr.lastIndexOf(CWD_SENTINEL);
    if (cwdIdx !== -1) {
      const afterSentinel = stderr.slice(cwdIdx + CWD_SENTINEL.length).trim();
      const newCwd = afterSentinel.split("\n")[0]?.trim();
      if (newCwd?.startsWith("/")) {
        execState.cwd = newCwd;
      }
      // Strip the sentinel and cwd from stderr
      stderr = stderr.slice(0, cwdIdx).trimEnd();
    }

    log.info(
      { connId, id, exitCode, killed, cwd: execState.cwd },
      "Exec command completed",
    );

    if (ws.readyState !== ws.OPEN) {
      stdoutSpiller.close();
      stderrSpiller.close();
      return;
    }

    const totalSize = stdoutBuf.totalBytes + stderrBuf.totalBytes;

    // DiskSpiller handles persistence lazily — close file descriptors now.
    // The files were written as chunks arrived, so they contain the full
    // untruncated output even though the in-memory buffer may have dropped
    // the middle.
    const outputPath = stdoutSpiller.active
      ? stdoutSpiller.filePath
      : undefined;
    stdoutSpiller.close();
    stderrSpiller.close();

    if (totalSize > MAX_INLINE_BYTES) {
      ws.send(
        JSON.stringify({
          type: "exec:done",
          id,
          exitCode,
          stdout:
            stdout.slice(0, 10_000) +
            "\n...[truncated]...\n" +
            stdout.slice(-10_000),
          stderr: stderr.slice(0, 4096),
          fullOutputPath: outputPath,
          fullOutputBytes: totalSize,
        }),
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "exec:done",
          id,
          exitCode,
          stdout,
          stderr,
          ...(outputPath
            ? { fullOutputPath: outputPath, fullOutputBytes: totalSize }
            : {}),
        }),
      );
    }
  });

  proc.on("error", (err) => {
    clearTimeout(timer);
    stdoutSpiller.close();
    stderrSpiller.close();
    log.error({ connId, id, err }, "Exec command error");

    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: "exec:done",
          id,
          exitCode: -1,
          stdout: stdoutBuf.toString(),
          stderr: `${stderrBuf.toString()}\n${err.message}`,
          error: err.message,
        }),
      );
    }
  });
}

const DEFAULT_READ_LIMIT = 8192;
const MAX_READ_LIMIT = 65_536;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function handleReadOutput(
  ws: WebSocket,
  connId: number,
  msg: {
    commandId: string;
    stream?: "stdout" | "stderr";
    offset?: number;
    limit?: number;
  },
): void {
  const { commandId, stream = "stdout", offset = 0 } = msg;

  if (!UUID_RE.test(commandId)) {
    ws.send(
      JSON.stringify({
        type: "readOutput:result",
        commandId,
        error: "Invalid commandId",
      }),
    );
    return;
  }

  const limit = Math.min(msg.limit ?? DEFAULT_READ_LIMIT, MAX_READ_LIMIT);

  const ext = stream === "stderr" ? ".txt.stderr" : ".txt";
  const filePath = `${homedir()}/.gremlin/output/${commandId}${ext}`;

  log.info(
    { connId, commandId, stream, offset, limit, filePath },
    "readOutput request",
  );

  try {
    if (!existsSync(filePath)) {
      ws.send(
        JSON.stringify({
          type: "readOutput:result",
          commandId,
          error: "Output file not found",
        }),
      );
      return;
    }

    const buf = Buffer.alloc(limit);
    const fd = openSync(filePath, "r");
    let bytesRead: number;
    try {
      bytesRead = readSync(fd, buf, 0, limit, offset);
    } finally {
      closeSync(fd);
    }

    const { size: totalBytes } = statSync(filePath);

    ws.send(
      JSON.stringify({
        type: "readOutput:result",
        commandId,
        stream,
        data: buf.subarray(0, bytesRead).toString("utf-8"),
        offset,
        bytesRead,
        totalBytes,
      }),
    );
  } catch (err) {
    log.error({ connId, commandId, err }, "readOutput failed");
    ws.send(
      JSON.stringify({
        type: "readOutput:result",
        commandId,
        error: (err as Error).message,
      }),
    );
  }
}
