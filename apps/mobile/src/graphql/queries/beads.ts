import { graphql } from "../generated/gql";

export const GetBeadQuery = graphql(`
  query GetBead($id: ID!) {
    bead(id: $id) {
      id
      title
      status
      assignee
      assigneeName
      parentId
      latestComment
      children {
        id
        title
        status
        assignee
        assigneeName
        latestComment
      }
    }
  }
`);

export const BeadUpdatedSubscription = graphql(`
  subscription BeadUpdated($id: ID!) {
    beadUpdated(id: $id) {
      id
      title
      status
      assignee
      assigneeName
      parentId
      latestComment
      children {
        id
        title
        status
        assignee
        assigneeName
        latestComment
      }
    }
  }
`);
