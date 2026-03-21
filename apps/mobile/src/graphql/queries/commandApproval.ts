import { graphql } from "../generated/gql";

export const ResolveCommandApprovalMutation = graphql(`
  mutation ResolveCommandApproval($id: ID!, $decision: CommandApprovalDecision!) {
    resolveCommandApproval(id: $id, decision: $decision) {
      id
      status
      decision
    }
  }
`);
