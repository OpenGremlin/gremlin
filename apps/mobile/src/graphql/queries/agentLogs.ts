import { graphql } from "../generated/gql";

export const AgentLogsQuery = graphql(`
  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          ...AgentLogFields
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

export const PendingInboxMessagesQuery = graphql(`
  query PendingInboxMessages($agentId: ID!, $taskId: String) {
    pendingInboxMessages(agentId: $agentId, taskId: $taskId) {
      id
      content
      createdAt
    }
  }
`);

export const AgentLogSubscription = graphql(`
  subscription AgentLogCreated($agentId: ID!) {
    agentLogCreated(agentId: $agentId) {
      ...AgentLogFields
    }
  }
`);

export const LogCreatedSubscription = graphql(`
  subscription LogCreated($agentId: ID, $taskId: ID) {
    logCreated(agentId: $agentId, taskId: $taskId) {
      ...AgentLogFields
    }
  }
`);

export const AgentStreamSubscription = graphql(`
  subscription AgentStream($agentId: ID!) {
    agentStream(agentId: $agentId) {
      logId
      agentId
      taskId
      delta
      done
    }
  }
`);

export const SpeechUrlsQuery = graphql(`
  query SpeechUrls($logId: ID!) {
    speechUrls(logId: $logId)
  }
`);

export const DocumentSpeechUrlsQuery = graphql(`
  query DocumentSpeechUrls($text: String!, $agentId: ID!) {
    documentSpeechUrls(text: $text, agentId: $agentId)
  }
`);

export const SpeechStreamSubscription = graphql(`
  subscription SpeechStream($agentId: ID, $taskId: ID) {
    speechStream(agentId: $agentId, taskId: $taskId) {
      logId
      agentId
      sentenceIndex
      url
      done
    }
  }
`);
