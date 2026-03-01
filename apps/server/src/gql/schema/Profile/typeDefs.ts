export const profileTypeDefs = /* GraphQL */ `
  type Profile {
    name: String!
    displayName: String!
    about: String!
    website: String
  }

  input ProfileInput {
    name: String!
    displayName: String!
    about: String!
    website: String
  }

  extend type Query {
    profile: Profile!
  }

  extend type Mutation {
    updateProfile(input: ProfileInput!): Profile!
  }
`;
