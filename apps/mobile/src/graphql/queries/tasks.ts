import { graphql } from "../generated/gql";

export const TasksQuery = graphql(`
  query Tasks($first: Int, $after: String, $last: Int, $before: String) {
    tasks(first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          id
          agent {
            id
            name
          }
          title
          message
          createdAt
          imageUrl(width: 200)
          files {
            ...FileFields
          }
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

export const TaskQuery = graphql(`
  query Task($id: ID!) {
    task(id: $id) {
      id
      agent {
        id
      }
      title
      message
      createdAt
      updatedAt
      completedAt
      imageUrl(width: 200)
      attachments {
        ... on FileAttachment {
          file {
            ...FileFields
          }
        }
        ... on LinkAttachment {
          url
          title
          description
        }
      }
      files {
        ...FileFields
      }
    }
  }
`);

export const TaskLogsQuery = graphql(`
  query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    taskLogs(taskId: $taskId, first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          id
          role
          content
          toolName
          toolInput
          toolResult
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

export const TaskLogSubscription = graphql(`
  subscription TaskLogCreated($taskId: ID!) {
    taskLogCreated(taskId: $taskId) {
      id
      role
      content
      toolName
      toolInput
      toolResult
      files {
        ...FileFields
      }
      taskId
      createdAt
    }
  }
`);

export const TaskUpdatedSubscription = graphql(`
  subscription TaskUpdated($taskId: ID!) {
    taskUpdated(taskId: $taskId) {
      id
      title
      message
      updatedAt
      completedAt
      imageUrl(width: 200)
      attachments {
        ... on FileAttachment {
          file {
            ...FileFields
          }
        }
        ... on LinkAttachment {
          url
          title
          description
        }
      }
      files {
        ...FileFields
      }
    }
  }
`);

export const SandboxOutputSubscription = graphql(`
  subscription SandboxOutput($taskId: ID!) {
    sandboxOutput(taskId: $taskId) {
      commandId
      stream
      data
      done
      exitCode
    }
  }
`);
