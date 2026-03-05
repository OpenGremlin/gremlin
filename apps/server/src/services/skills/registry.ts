export interface McpStdioTransport {
  type: "stdio";
  command: string;
  args: string[];
}

export interface McpRemoteTransport {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
}

export interface SkillConnectionRequirement {
  /** References IntegrationProvider.id */
  providerId: string;
  /** Maps env var name to connection meta field, e.g. { "GITHUB_TOKEN": "accessToken" } */
  envMapping: Record<string, string>;
  reason: string;
  optional?: boolean;
  requiredScopes?: string[];
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  homepage?: string;
  icon?: string;
  /** Instructions injected into the agent system prompt when this skill is active */
  instructions?: string;
  mcp?: {
    transport: McpStdioTransport | McpRemoteTransport;
    /** Static non-secret env vars */
    env?: Record<string, string>;
  };
  requiredConnections?: SkillConnectionRequirement[];
  tags?: string[];
}
