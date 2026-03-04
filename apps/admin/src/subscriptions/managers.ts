import { SubscriptionManager } from "./SubscriptionManager";

export const taskSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription TasksUpdated($taskIds: [ID!]!) {
  tasksUpdated(taskIds: $taskIds) {
    id
    title
    message
    updatedAt
    completedAt
    imageUrl(width: 200)
    artifacts
    documents {
      path
      title
      body
    }
  }
}`,
  "taskIds",
);

export const agentSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription AgentsUpdated($agentIds: [ID!]!) {
  agentsUpdated(agentIds: $agentIds) {
    id
    name
  }
}`,
  "agentIds",
);
