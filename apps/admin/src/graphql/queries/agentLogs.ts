import { graphql } from "../generated/gql";

export const AgentLogsQuery = graphql(`
  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          id
          role
          content
          toolName
          toolInput
          toolResult
          taskId
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`);

// Raw string mutation (return type changed from AgentLog to SendMessageResult)
export const SendMessageMutation = /* GraphQL */ `
  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {
    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {
      queued
      content
    }
  }
`;

export const AgentLogSubscription = graphql(`
  subscription AgentLogCreated($agentId: ID!) {
    agentLogCreated(agentId: $agentId) {
      id
      role
      content
      toolName
      toolInput
      toolResult
      taskId
      createdAt
    }
  }
`);
