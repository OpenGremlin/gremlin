import { graphql } from "../generated/gql";

export const SkillTemplatesQuery = graphql(`
  query SkillTemplates {
    skillTemplates {
      id
      name
      description
      version
      author
      category
      icon
      tags
      hasInstall
      connections {
        provider
        providerName
        reason
        optional
        requestedScopes
      }
    }
  }
`);

export const SkillTemplateQuery = graphql(`
  query SkillTemplate($id: ID!) {
    skillTemplate(id: $id) {
      id
      name
      description
      version
      author
      category
      icon
      tags
      hasInstall
      connections {
        provider
        providerName
        reason
        optional
        requestedScopes
      }
    }
  }
`);

export const AgentSkillsQuery = graphql(`
  query AgentSkills($agentId: ID!) {
    agentSkills(agentId: $agentId) {
      skillId
      agentId
      assignedAt
      template {
        id
        name
        description
        version
        category
        icon
        connections {
          provider
          providerName
          reason
          optional
        }
      }
      connectionStatuses {
        provider
        providerName
        reason
        optional
        boundConnectionId
        connected
      }
    }
  }
`);

export const AssignSkillMutation = graphql(`
  mutation AssignSkill($agentId: ID!, $skillId: ID!) {
    assignSkill(agentId: $agentId, skillId: $skillId) {
      skillId
      agentId
      assignedAt
      template {
        id
        name
        description
        version
        category
        icon
      }
      connectionStatuses {
        provider
        providerName
        reason
        optional
        boundConnectionId
        connected
      }
    }
  }
`);

export const RemoveSkillMutation = graphql(`
  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {
    removeSkill(agentId: $agentId, skillId: $skillId)
  }
`);

export const BindAgentSkillConnectionMutation = graphql(`
  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {
      skillId
      agentId
      connectionStatuses {
        provider
        boundConnectionId
        connected
      }
    }
  }
`);
