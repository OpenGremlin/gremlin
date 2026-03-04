import { graphql } from "../generated/gql";

export const AgentsQuery = graphql(`
  query Agents {
    agents {
      id
      name
      soul
      statusReason
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
      status
      statusReason
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
    }
  }
`);

export const AgentUpdatedSubscription = graphql(`
  subscription AgentUpdated($agentId: ID!) {
    agentUpdated(agentId: $agentId) {
      id
      status
      statusReason
    }
  }
`);
