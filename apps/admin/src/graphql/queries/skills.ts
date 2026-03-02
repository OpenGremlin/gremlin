import { graphql } from "../generated/gql";

export const SkillsQuery = graphql(`
  query Skills {
    skills {
      id
      name
      description
      version
      installed
    }
  }
`);

export const SkillQuery = graphql(`
  query Skill($id: ID!) {
    skill(id: $id) {
      id
      name
      description
      version
      author
      installed
      category
      homepage
      requiredEnv
    }
  }
`);

export const InstallSkillMutation = graphql(`
  mutation InstallSkill($id: ID!) {
    installSkill(id: $id) {
      id
      name
      description
      version
      author
      installed
      category
      homepage
      requiredEnv
    }
  }
`);

export const UninstallSkillMutation = graphql(`
  mutation UninstallSkill($id: ID!) {
    uninstallSkill(id: $id) {
      id
      name
      description
      version
      author
      installed
      category
      homepage
      requiredEnv
    }
  }
`);
