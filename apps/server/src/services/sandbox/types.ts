import type WebSocket from "ws";

export interface SandboxSession {
  instanceId: string;
  privateIp: string;
  wsUrl: string;
  agentId: string;
  ws?: WebSocket;
}

export interface BrowserSession {
  taskArn: string;
  privateIp: string;
  agentId: string;
}

export interface CommandResult {
  output: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
}
