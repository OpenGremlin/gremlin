export const profileTypeDefs = /* GraphQL */ `
  type Profile {
    displayName: String!
    about: String!
    website: String
    timezone: String
  }

  input ProfileInput {
    displayName: String!
    about: String!
    website: String
    timezone: String
  }

  extend type Query {
    profile: Profile!
  }

  extend type Mutation {
    updateProfile(input: ProfileInput!): Profile!
  }
`;
