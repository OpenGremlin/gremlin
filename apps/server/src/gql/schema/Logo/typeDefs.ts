export const logoTypeDefs = /* GraphQL */ `
  type Logo {
    id: ID!
    darkUrl(width: Int): String!
    lightUrl(width: Int): String!
  }

  extend type Query {
    logos: [Logo!]!
  }
`;
