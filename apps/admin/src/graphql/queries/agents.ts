import { graphql } from "../generated/gql";

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
      id
      name
      avatar
      portraitId
      imageUrl(width: 200)
      soul
      retired
      ttsVoice
    }
  }
`);

export const UpdateAgentMutation = graphql(`
  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
    updateAgent(id: $id, input: $input) {
      id
      name
      avatar
      soul
      ttsVoice
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
      id
      name
    }
  }
`);
