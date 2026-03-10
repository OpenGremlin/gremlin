import { SubscriptionManager } from "./SubscriptionManager";

export const taskSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription TaskUpdated($taskId: ID!) {
  taskUpdated(taskId: $taskId) {
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
  "taskId",
);

export const agentSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription AgentUpdated($agentId: ID!) {
  agentUpdated(agentId: $agentId) {
    id
    name
  }
}`,
  "agentId",
);
