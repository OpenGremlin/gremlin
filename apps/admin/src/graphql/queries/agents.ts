import { graphql } from "../generated/gql";

export const AgentDetailFragment = graphql(`
  fragment AgentDetail on Agent {
    id
    name
    avatar
    portraitId
    imageUrl(width: 200)
    soul
    retired
    ttsVoice
    config {
      model {
        type
        modelId
        connectionId
      }
      sandbox {
        enabled
        idleTimeoutMinutes
        alwaysOn
      }
      webSearch {
        enabled
        provider
      }
      browser {
        enabled
      }
    }
  }
`);

export const AgentsQuery = graphql(`
  query Agents {
    agents {
      id
      name
      soul
      retired
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
      id
      name
      soul
    }
  }
`);

export const RetireAgentMutation = graphql(`
  mutation RetireAgent($id: ID!) {
    retireAgent(id: $id) {
      id
      retired
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
