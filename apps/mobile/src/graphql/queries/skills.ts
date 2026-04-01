import { graphql } from "../generated/gql";

export const SkillTemplatesQuery = graphql(`
  query SkillTemplates {
    skillTemplates {
      id
      name
      displayName
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
        multi
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
      displayName
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
        multi
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
        displayName
        description
        version
        category
        icon
        connections {
          provider
          providerName
          reason
          optional
          multi
        }
      }
      connectionStatuses {
        provider
        providerName
        reason
        optional
        multi
        boundConnectionIds
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
        displayName
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
        multi
        boundConnectionIds
        connected
      }
    }
  }
`);

export const RemoveSkillMutation = graphql(`
  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {
    removeSkill(agentId: $agentId, skillId: $skillId) {
      skillId
      agentId
    }
  }
`);

export const BindAgentSkillConnectionMutation = graphql(`
  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {
      skillId
      agentId
      connectionStatuses {
        provider
        boundConnectionIds
        connected
      }
    }
  }
`);

export const UnbindAgentSkillConnectionMutation = graphql(`
  mutation UnbindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
    unbindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {
      skillId
      agentId
      connectionStatuses {
        provider
        boundConnectionIds
        connected
      }
    }
  }
`);
