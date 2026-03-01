export const taskFollowUpTypeDefs = /* GraphQL */ `
  type TaskFollowUp {
    id: ID!
    task: Task!
    agent: Agent!
    scheduledAt: String!
    prompt: String!
    active: Boolean!
    createdAt: String!
  }

  extend type Query {
    activeFollowUps: [TaskFollowUp!]!
    taskFollowUps(taskId: ID!): [TaskFollowUp!]!
  }
`;
