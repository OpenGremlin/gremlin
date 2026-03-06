import { createPubSub } from "@graphql-yoga/subscription";
import type { AgentItem } from "./ddb/schema/agent.js";
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

export type PubSubEvents = {
  [key: `agentLogCreated:${string}`]: [AgentLogItem];
  [key: `agentLogCreated:task:${string}`]: [AgentLogItem];
  [key: `agentUpdated:${string}`]: [AgentItem];
  [key: `taskUpdated:${string}`]: [TaskItem];
  [key: `inboxItemCreated:${string}`]: [InboxItemItem];
  [key: `sandboxOutput:${string}`]: [SandboxOutputEvent];
};

export const pubsub = createPubSub<PubSubEvents>();

export type PubSub = typeof pubsub;
