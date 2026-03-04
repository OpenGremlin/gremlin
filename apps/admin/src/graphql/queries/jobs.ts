import { graphql } from "../generated/gql";

export const AgentJobsQuery = graphql(`
  query AgentJobs {
    agentJobs {
      id
      name
      description
      recurrence
      cronExpression
      timezone
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
      timezone
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
        createdAt
      }
    }
  }
`);

export const DeleteAgentJobMutation = graphql(`
  mutation DeleteAgentJob($id: ID!) {
    deleteAgentJob(id: $id) { id }
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
      timezone
      agent {
        id
      }
      status
      lastRun
      nextRun
    }
  }
`);

export const CreateAgentJobMutation = graphql(`
  mutation CreateAgentJob($input: CreateAgentJobInput!) {
    createAgentJob(input: $input) {
      id
    }
  }
`);
