import { gql } from "@apollo/client";

export const GetBeadQuery = gql`
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
`;

export const BeadUpdatedSubscription = gql`
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
`;
