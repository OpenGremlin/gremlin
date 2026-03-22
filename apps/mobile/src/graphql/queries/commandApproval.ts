import { graphql } from "../generated/gql";

export const PendingCommandApprovalsQuery = graphql(`
  query PendingCommandApprovals {
    pendingCommandApprovals {
      id
      agent {
        id
        name
      }
      taskId
      command
      reason
      status
      decision
      createdAt
    }
  }
`);

export const ResolveCommandApprovalMutation = graphql(`
  mutation ResolveCommandApproval($id: ID!, $decision: CommandApprovalDecision!) {
    resolveCommandApproval(id: $id, decision: $decision) {
      id
      status
      decision
    }
  }
`);
