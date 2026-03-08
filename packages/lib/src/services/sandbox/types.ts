import type WebSocket from "ws";

export interface SandboxSession {
  instanceId: string;
  privateIp: string;
  wsUrl: string;
  agentId: string;
  ws?: WebSocket;
  lastActivityAt: number;
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
  backgrounded?: boolean;
  commandId?: string;
  durationMs: number;
}

export interface BackgroundCommand {
  id: string;
  command: string;
  agentId: string;
  startTime: number;
  stdout: string;
  stderr: string;
  done: boolean;
  exitCode?: number;
}
