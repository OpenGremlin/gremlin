import type WebSocket from "ws";

export interface SandboxSession {
  instanceId: string;
  privateIp: string;
  wsUrl: string;
  agentId: string;
  ws?: WebSocket;
  lastActivityAt: number;
}

export interface CommandResult {
  output: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  commandId?: string;
  durationMs: number;
  /** Total bytes of combined stdout+stderr before truncation. */
  totalOutputBytes?: number;
  /** True when output was truncated and more is available via readOutput. */
  outputTruncated?: boolean;
}

export interface ReadOutputResult {
  data: string;
  stream: "stdout" | "stderr";
  offset: number;
  bytesRead: number;
  totalBytes: number;
}
