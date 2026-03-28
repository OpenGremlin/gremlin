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
