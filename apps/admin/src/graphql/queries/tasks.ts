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
          status
          message
          createdAt
          imageUrl(width: 100)
          documents {
            id
            title
            body
            createdAt
            updatedAt
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
      status
      message
      createdAt
      updatedAt
      completedAt
      imageUrl(width: 100)
      artifacts
      documents {
        id
        title
        body
        createdAt
        updatedAt
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
      status
      message
      updatedAt
      completedAt
      imageUrl(width: 100)
      artifacts
      documents {
        id
        title
        body
        updatedAt
      }
    }
  }
`);
