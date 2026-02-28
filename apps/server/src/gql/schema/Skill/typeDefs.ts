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
  }

  extend type Query {
    skills: [Skill!]!
    skill(id: ID!): Skill
    searchSkills(query: String!): [Skill!]!
  }

  extend type Mutation {
    installSkill(id: ID!): Skill
    uninstallSkill(id: ID!): Skill
  }
`;
