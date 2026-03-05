export const skillTypeDefs = /* GraphQL */ `
  type Skill {
    id: ID!
    name: String!
    description: String!
    version: String!
    author: String!
    installed: Boolean!
    category: String!
    homepage: String
    requiredEnv: [String!]!
    installedAt: String
    mcpEnabled: Boolean
    hasInstructions: Boolean!
    hasMcp: Boolean!
    requiredConnections: [SkillConnectionStatus!]!
  }

  type SkillConnectionStatus {
    providerId: String!
    providerName: String!
    reason: String!
    optional: Boolean!
    boundConnectionId: String
    connected: Boolean!
  }

  extend type Query {
    skills: [Skill!]!
    skill(id: ID!): Skill
    searchSkills(query: String!): [Skill!]!
  }

  extend type Mutation {
    installSkill(id: ID!): Skill
    uninstallSkill(id: ID!): Skill
    bindSkillConnection(skillId: ID!, providerId: String!, connectionId: ID!): Skill
    setSkillMcpEnabled(skillId: ID!, enabled: Boolean!): Skill
  }
`;
