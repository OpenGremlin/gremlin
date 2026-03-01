export const profileTypeDefs = /* GraphQL */ `
  type Profile {
    displayName: String!
    about: String!
    website: String
  }

  input ProfileInput {
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
