import { graphql } from "../generated/gql";

export const CommandAllowlistQuery = graphql(`
  query CommandAllowlist($agentId: ID!) {
    commandAllowlist(agentId: $agentId) {
      pattern
    }
  }
`);

export const AddCommandAllowlistEntryMutation = graphql(`
  mutation AddCommandAllowlistEntry($agentId: ID!, $pattern: String!) {
    addCommandAllowlistEntry(agentId: $agentId, pattern: $pattern) {
      pattern
    }
  }
`);

export const RemoveCommandAllowlistEntryMutation = graphql(`
  mutation RemoveCommandAllowlistEntry($agentId: ID!, $pattern: String!) {
    removeCommandAllowlistEntry(agentId: $agentId, pattern: $pattern) {
      pattern
    }
  }
`);
