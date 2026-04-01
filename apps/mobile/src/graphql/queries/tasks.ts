import { graphql } from "../generated/gql";

export const TasksQuery = graphql(`
  query Tasks($first: Int, $after: String, $last: Int, $before: String) {
    tasks(first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          ...TaskSummary
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
      ...TaskDetail
    }
  }
`);

export const TaskLogsQuery = graphql(`
  query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    taskLogs(taskId: $taskId, first: $first, after: $after, last: $last, before: $before) {
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

export const TaskLogSubscription = graphql(`
  subscription TaskLogCreated($taskId: ID!) {
    taskLogCreated(taskId: $taskId) {
      ...AgentLogFields
    }
  }
`);

export const TaskUpdatedSubscription = graphql(`
  subscription TaskUpdated($taskId: ID!) {
    taskUpdated(taskId: $taskId) {
      ...TaskDetail
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
