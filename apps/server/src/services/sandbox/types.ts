import type WebSocket from "ws";

export interface SandboxSession {
  taskArn: string;
  privateIp: string;
  wsUrl: string;
  agentId: string;
  ws?: WebSocket;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  timedOut: boolean;
}
