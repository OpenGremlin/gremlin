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
}
