import { createPubSub } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "./ddb/schema/agentLog.js";

export type PubSubEvents = {
  [key: `agentLogCreated:${string}`]: [AgentLogItem];
  [key: `agentLogCreated:task:${string}`]: [AgentLogItem];
};

export const pubsub = createPubSub<PubSubEvents>();

export type PubSub = typeof pubsub;
