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
  /** Derived from the directory name (e.g. "gws-gmail", "gws-calendar") */
  id: string;
  /** Unique skill identifier, matches the directory name */
  name: string;
  /** Human-readable display name for the UI (e.g. "Google Calendar (GWS CLI)") */
  displayName?: string;
  description: string;
  version: string;
  author?: string;
  category?: string;
  homepage?: string;
  icon?: string;
  tags?: string[];
  /** Auth connections the skill needs */
  connections?: SkillConnectionRequirement[];
  /** The Markdown body after frontmatter — loaded on initialization, not at catalog time */
  instructions?: string;
}
