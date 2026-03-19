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
    files {
      path
      name
      sizeBytes
      mimeType
      modifiedAt
      render {
        __typename
        ... on DocumentRender { markdown title }
        ... on CodeRender { content language }
        ... on ImageRender { url(width: 800) width height aspectRatio }
        ... on AudioRender { url durationSeconds }
        ... on VideoRender { url thumbnailUrl(width: 400) durationSeconds }
        ... on UnknownRender { mimeType sizeBytes }
      }
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
