import { graphql } from "../generated/gql";

export const AgentsQuery = graphql(`
  query Agents {
    agents {
      ...AgentSummary
    }
  }
`);

export const AgentQuery = graphql(`
  query Agent($id: ID!) {
    agent(id: $id) {
      ...AgentDetail
    }
  }
`);

export const UpdateAgentMutation = graphql(`
  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
    updateAgent(id: $id, input: $input) {
      ...AgentDetail
    }
  }
`);

export const CreateAgentMutation = graphql(`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      ...AgentSummary
    }
  }
`);

export const RetireAgentMutation = graphql(`
  mutation RetireAgent($id: ID!) {
    retireAgent(id: $id) {
      ...AgentSummary
    }
  }
`);

export const UnretireAgentMutation = graphql(`
  mutation UnretireAgent($id: ID!) {
    unretireAgent(id: $id) {
      ...AgentSummary
    }
  }
`);

export const AgentUpdatedSubscription = graphql(`
  subscription AgentUpdated($agentId: ID!) {
    agentUpdated(agentId: $agentId) {
      ...AgentDetail
    }
  }
`);
