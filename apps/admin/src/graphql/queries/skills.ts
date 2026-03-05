import { graphql } from "../generated/gql";

export const SkillsQuery = graphql(`
  query Skills {
    skills {
      id
      installed
      template {
        id
        name
        description
        version
        category
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
