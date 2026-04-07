import { graphql } from "../generated/gql";

export const SkillTemplatesQuery = graphql(`
  query SkillTemplates {
    skillTemplates {
      ...SkillTemplateFields
    }
  }
`);

export const SkillTemplateQuery = graphql(`
  query SkillTemplate($id: ID!) {
    skillTemplate(id: $id) {
      ...SkillTemplateFields
      instructions
    }
  }
`);

export const AgentSkillsQuery = graphql(`
  query AgentSkills($agentId: ID!) {
    agentSkills(agentId: $agentId) {
      ...AgentSkillFields
    }
  }
`);

export const AssignSkillMutation = graphql(`
  mutation AssignSkill($agentId: ID!, $skillId: ID!) {
    assignSkill(agentId: $agentId, skillId: $skillId) {
      ...AgentSkillFields
    }
  }
`);

export const RemoveSkillMutation = graphql(`
  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {
    removeSkill(agentId: $agentId, skillId: $skillId) {
      ...AgentSkillFields
    }
  }
`);

export const BindAgentSkillConnectionMutation = graphql(`
  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {
      ...AgentSkillFields
    }
  }
`);

export const UnbindAgentSkillConnectionMutation = graphql(`
  mutation UnbindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
    unbindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {
      ...AgentSkillFields
    }
  }
`);
