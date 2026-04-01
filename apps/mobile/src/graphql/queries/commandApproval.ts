import { graphql } from "../generated/gql";

export const PendingCommandApprovalsQuery = graphql(`
  query PendingCommandApprovals {
    pendingCommandApprovals {
      ...CommandApprovalFields
    }
  }
`);

export const ResolveCommandApprovalMutation = graphql(`
  mutation ResolveCommandApproval($id: ID!, $decision: CommandApprovalDecision!) {
    resolveCommandApproval(id: $id, decision: $decision) {
      ...CommandApprovalFields
    }
  }
`);
