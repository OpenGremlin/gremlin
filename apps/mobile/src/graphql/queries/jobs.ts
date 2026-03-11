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
      paused
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
      paused
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
      paused
      lastRun
      nextRun
    }
  }
`);

export const JobTaskCreatedSubscription = graphql(`
  subscription JobTaskCreated($jobId: ID!) {
    jobTaskCreated(jobId: $jobId) {
      id
      agent {
        id
      }
      title
      createdAt
    }
  }
`);

export const TriggerJobMutation = graphql(`
  mutation TriggerJob($id: ID!) {
    triggerJob(id: $id)
  }
`);

export const CreateAgentJobMutation = graphql(`
  mutation CreateAgentJob($input: CreateAgentJobInput!) {
    createAgentJob(input: $input) {
      id
    }
  }
`);
