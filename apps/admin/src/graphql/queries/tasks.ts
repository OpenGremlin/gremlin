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
      artifacts
      documents {
        id
        title
        body
        createdAt
        updatedAt
      }
      logs(last: 50) {
        edges {
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
