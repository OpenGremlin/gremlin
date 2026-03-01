import { createPubSub } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "./ddb/schema/agentLog.js";
import type { DocumentItem } from "./ddb/schema/document.js";
import type { TaskItem } from "./ddb/schema/task.js";

export type PubSubEvents = {
  [key: `agentLogCreated:${string}`]: [AgentLogItem];
  [key: `agentLogCreated:task:${string}`]: [AgentLogItem];
  [key: `taskUpdated:${string}`]: [TaskItem];
  [key: `documentUpdated:${string}`]: [DocumentItem];
};

export const pubsub = createPubSub<PubSubEvents>();

export type PubSub = typeof pubsub;
