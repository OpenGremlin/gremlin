import { graphql } from "../generated/gql";

export const AgentJobsQuery = graphql(`
  query AgentJobs {
    agentJobs {
      ...AgentJobSummary
    }
  }
`);

export const AgentJobQuery = graphql(`
  query AgentJob($id: ID!) {
    agentJob(id: $id) {
      ...AgentJobDetail
    }
  }
`);

export const DeleteAgentJobMutation = graphql(`
  mutation DeleteAgentJob($id: ID!) {
    deleteAgentJob(id: $id) {
      ...AgentJobSummary
    }
  }
`);

export const UpdateAgentJobMutation = graphql(`
  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {
    updateAgentJob(id: $id, input: $input) {
      ...AgentJobSummary
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
    triggerJob(id: $id) {
      ...AgentJobSummary
    }
  }
`);

export const JobCreatedSubscription = graphql(`
  subscription JobCreated {
    jobCreated {
      ...AgentJobSummary
    }
  }
`);

export const CreateAgentJobMutation = graphql(`
  mutation CreateAgentJob($input: CreateAgentJobInput!) {
    createAgentJob(input: $input) {
      ...AgentJobSummary
    }
  }
`);
