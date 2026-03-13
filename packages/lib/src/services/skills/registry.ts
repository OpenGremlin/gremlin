export interface SkillConnectionRequirement {
  /** References IntegrationProvider.id */
  provider: string;
  /** Maps env var name to connection meta field, e.g. { "GITHUB_TOKEN": "accessToken" } */
  env: Record<string, string>;
  reason: string;
  optional?: boolean;
  /** Allow multiple connections for this provider (e.g. two Google accounts) */
  multi?: boolean;
  requestedScopes?: string[];
}

export interface SkillTemplate {
  /** Derived from the directory name (e.g. "github", "google-workspace") */
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  category?: string;
  homepage?: string;
  icon?: string;
  tags?: string[];
  /** Auth connections the skill needs */
  connections?: SkillConnectionRequirement[];
  /** Idempotent shell script to install dependencies */
  install?: string;
  /** The Markdown body after frontmatter — loaded on initialization, not at catalog time */
  instructions?: string;
}
