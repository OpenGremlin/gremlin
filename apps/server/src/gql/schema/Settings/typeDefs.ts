export const settingsTypeDefs = /* GraphQL */ `
  type GlobalSettings {
    signupDisabled: Boolean!
  }

  extend type Query {
    globalSettings: GlobalSettings!
  }

  extend type Mutation {
    updateGlobalSettings(signupDisabled: Boolean): GlobalSettings!
  }
`;
