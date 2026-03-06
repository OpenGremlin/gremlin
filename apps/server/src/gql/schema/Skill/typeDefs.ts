export const skillTypeDefs = /* GraphQL */ `
  type SkillTemplate {
    id: ID!
    name: String!
    description: String!
    version: String!
    author: String!
    category: String!
    icon: String
    hasInstructions: Boolean!
    hasMcp: Boolean!
    installCount: Int!
    requiredConnections: [SkillConnectionRequirement!]!
  }

  type SkillConnectionRequirement {
    providerId: String!
    providerName: String!
    reason: String!
    optional: Boolean!
  }

  type Skill {
    id: ID!
    template: SkillTemplate!
    installed: Boolean!
    installedAt: String
    mcpEnabled: Boolean
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
    "All templates from the catalog"
    skillTemplates: [SkillTemplate!]!
    skillTemplate(id: ID!): SkillTemplate
    "All installed skill instances"
    skills: [Skill!]!
    skill(id: ID!): Skill
  }

  extend type Mutation {
    installSkill(templateId: ID!): Skill
    uninstallSkill(id: ID!): Skill
    bindSkillConnection(id: ID!, providerId: String!, connectionId: ID!): Skill
    setSkillMcpEnabled(id: ID!, enabled: Boolean!): Skill
  }
`;
