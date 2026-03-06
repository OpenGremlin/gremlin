import { graphql } from "../generated/gql";

export const SkillTemplatesQuery = graphql(`
  query SkillTemplates {
    skillTemplates {
      id
      name
      description
      version
      category
      icon
      installCount
      requiredConnections {
        providerId
        providerName
        reason
        optional
      }
    }
  }
`);

export const SkillsQuery = graphql(`
  query Skills {
    skills {
      id
      installed
      installedAt
      template {
        id
        name
        description
        version
        category
        icon
      }
    }
  }
`);

export const SkillQuery = graphql(`
  query Skill($id: ID!) {
    skill(id: $id) {
      id
      installed
      installedAt
      mcpEnabled
      template {
        id
        name
        description
        version
        author
        category
        icon
        requiredConnections {
          providerId
          providerName
          reason
          optional
        }
      }
      requiredConnections {
        providerId
        providerName
        reason
        optional
        boundConnectionId
        connected
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
      installCount
      requiredConnections {
        providerId
        providerName
        reason
        optional
      }
    }
  }
`);

export const InstallSkillMutation = graphql(`
  mutation InstallSkill($templateId: ID!) {
    installSkill(templateId: $templateId) {
      id
      installed
      template {
        id
        name
        description
        version
        author
        category
      }
      requiredConnections {
        providerId
        providerName
        reason
        optional
        boundConnectionId
        connected
      }
    }
  }
`);

export const BindSkillConnectionMutation = graphql(`
  mutation BindSkillConnection($id: ID!, $providerId: String!, $connectionId: ID!) {
    bindSkillConnection(id: $id, providerId: $providerId, connectionId: $connectionId) {
      id
      requiredConnections {
        providerId
        boundConnectionId
        connected
      }
    }
  }
`);

export const UninstallSkillMutation = graphql(`
  mutation UninstallSkill($id: ID!) {
    uninstallSkill(id: $id) {
      id
      installed
      template {
        id
        name
      }
    }
  }
`);
