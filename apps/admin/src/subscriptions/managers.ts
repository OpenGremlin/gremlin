import { SubscriptionManager } from "./SubscriptionManager";

export const taskSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription TasksUpdated($taskIds: [ID!]!) {
  tasksUpdated(taskIds: $taskIds) {
    id
    title
    status
    message
    updatedAt
    completedAt
    imageUrl(width: 200)
    artifacts
    documents {
      id
      title
      body
      updatedAt
    }
  }
}`,
  "taskIds",
);

export const agentSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription AgentsUpdated($agentIds: [ID!]!) {
  agentsUpdated(agentIds: $agentIds) {
    id
    status
    statusReason
  }
}`,
  "agentIds",
);

export const documentSubscriptionManager = new SubscriptionManager(
  /* GraphQL */ `subscription DocumentsUpdated($documentIds: [ID!]!) {
  documentsUpdated(documentIds: $documentIds) {
    id
    title
    body
    updatedAt
  }
}`,
  "documentIds",
);
