import { graphql } from "../generated/gql";

export const AgentJobsQuery = graphql(`
  query AgentJobs {
    agentJobs {
      id
      name
      description
      recurrence
      cronExpression
      agent {
        id
      }
      status
      lastRun
      nextRun
    }
  }
`);

export const AgentJobQuery = graphql(`
  query AgentJob($id: ID!) {
    agentJob(id: $id) {
      id
      name
      description
      recurrence
      cronExpression
      agent {
        id
        name
      }
      status
      lastRun
      nextRun
      tasks {
        id
        agent {
          id
        }
        title
        status
        createdAt
      }
    }
  }
`);

export const UpdateAgentJobMutation = graphql(`
  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {
    updateAgentJob(id: $id, input: $input) {
      id
      name
      description
      recurrence
      cronExpression
      agent {
        id
      }
      status
      lastRun
      nextRun
    }
  }
`);
