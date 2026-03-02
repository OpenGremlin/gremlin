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

export const SendMessageMutation = graphql(`
  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {
    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {
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
