export const avatarTypeDefs = /* GraphQL */ `
  type Avatar {
    id: ID!
    name: String!
    url(width: Int): String!
  }

  extend type Query {
    avatars: [Avatar!]!
  }
`;
