import type { Repeater } from "@repeaterjs/repeater";
import type { AgentItem } from "./ddb/schema/agent.js";
import type { AgentJobItem } from "./ddb/schema/agentJob.js";
import type { AgentLogItem } from "./ddb/schema/agentLog.js";
import type { InboxItemItem } from "./ddb/schema/inboxItem.js";
import type { TaskItem } from "./ddb/schema/task.js";

export interface SandboxOutputEvent {
  commandId: string;
  stream: "stdout" | "stderr";
  data: string;
  done?: boolean;
  exitCode?: number;
}

export interface AgentStreamEvent {
  logId: string;
  agentId: string;
  taskId: string | null;
  delta: string;
  done: boolean;
  /** "text" (default) or "reasoning" */
  kind?: string;
}

export interface SpeechAudioEvent {
  logId: string;
  agentId: string;
  sentenceIndex: number;
  /** Signed URL for on-demand TTS of this sentence. Empty string when done=true. */
  url: string;
  done: boolean;
}

/** Raw bead issue shape as returned by the beads MCP server. */
export interface BeadIssueEvent {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  parent_id?: string;
  latest_comment?: string;
  children?: BeadIssueEvent[];
}

export type PubSubEvents = {
  [key: `agentLogCreated:${string}`]: [AgentLogItem];
  [key: `agentLogCreated:task:${string}`]: [AgentLogItem];
  [key: `agentUpdated:${string}`]: [AgentItem];
  [key: `taskUpdated:${string}`]: [TaskItem];
  [key: `jobTaskCreated:${string}`]: [TaskItem];
  jobCreated: [AgentJobItem];
  [key: `inboxItemCreated:${string}`]: [InboxItemItem];
  [key: `sandboxOutput:${string}`]: [SandboxOutputEvent];
  [key: `agentStream:${string}`]: [AgentStreamEvent];
  [key: `speechAudio:${string}`]: [SpeechAudioEvent];
  [key: `speechAudio:task:${string}`]: [SpeechAudioEvent];
  [key: `beadUpdated:${string}`]: [BeadIssueEvent];
  pendingItemsUpdated: [];
};

export interface PubSub {
  publish<K extends keyof PubSubEvents & string>(
    topic: K,
    ...args: PubSubEvents[K]
  ): void;
  subscribe<K extends keyof PubSubEvents & string>(
    topic: K,
  ): Repeater<PubSubEvents[K][0]>;
}
