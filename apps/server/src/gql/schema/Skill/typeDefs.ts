export const skillTypeDefs = /* GraphQL */ `
  type SkillTemplate {
    id: ID!
    name: String!
    description: String!
    version: String!
    author: String
    category: String
    icon: String
    tags: [String!]
    hasInstall: Boolean!
    connections: [SkillConnectionRequirement!]!
  }

  type SkillConnectionRequirement {
    provider: String!
    providerName: String!
    reason: String!
    optional: Boolean!
    requestedScopes: [String!]
  }

  type AgentSkill {
    skillId: ID!
    agentId: ID!
    template: SkillTemplate
    assignedAt: String!
    connectionStatuses: [SkillConnectionStatus!]!
  }

  type SkillConnectionStatus {
    provider: String!
    providerName: String!
    reason: String!
    optional: Boolean!
    boundConnectionId: String
    connected: Boolean!
  }

  extend type Query {
    "All skill templates from the catalog"
    skillTemplates: [SkillTemplate!]!
    "Single skill template by ID"
    skillTemplate(id: ID!): SkillTemplate
    "Skills assigned to a specific agent"
    agentSkills(agentId: ID!): [AgentSkill!]!
  }

  extend type Mutation {
    "Assign a skill to an agent"
    assignSkill(agentId: ID!, skillId: ID!): AgentSkill!
    "Remove a skill from an agent"
    removeSkill(agentId: ID!, skillId: ID!): Boolean!
    "Bind a connection to an agent's skill"
    bindAgentSkillConnection(agentId: ID!, skillId: ID!, provider: String!, connectionId: ID!): AgentSkill!
  }
`;
