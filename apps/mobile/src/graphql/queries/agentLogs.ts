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
          commandApprovalId
          files {
            ...FileFields
          }
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
      queued
      content
    }
  }
`);

export const RequestFileUploadsMutation = graphql(`
  mutation RequestFileUploads($agentId: String!, $taskId: String, $files: [FileUploadRequest!]!) {
    requestFileUploads(agentId: $agentId, taskId: $taskId, files: $files) {
      uploadId
      presignedUrl
      key
    }
  }
`);

export const CompleteFileUploadMutation = graphql(`
  mutation CompleteFileUpload($input: CompleteFileUploadInput!) {
    completeFileUpload(input: $input) {
      path
      filename
      sizeBytes
      contentType
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
      commandApprovalId
      files {
        ...FileFields
      }
      taskId
      createdAt
    }
  }
`);
