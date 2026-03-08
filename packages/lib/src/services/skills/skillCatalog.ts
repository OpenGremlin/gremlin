import type { SkillTemplate } from "./registry.js";

export const skillCatalog: SkillTemplate[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Manage repositories, issues, and pull requests via the GitHub MCP server.",
    version: "1.0.0",
    author: "gremlin",
    category: "developer",
    icon: "github",
    instructions: [
      "You have access to GitHub tools via MCP.",
      "Use them to read repos, create issues, open PRs, and review code.",
      "Always confirm destructive actions (force-push, delete branch) with the user first.",
    ].join(" "),
    mcp: {
      transport: {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
      },
    },
    requiredConnections: [
      {
        providerId: "github",
        envMapping: { GITHUB_PERSONAL_ACCESS_TOKEN: "accessToken" },
        reason: "Authenticate with GitHub to access repositories and issues.",
        requiredScopes: ["repo"],
      },
    ],
    tags: ["developer", "git", "code"],
  },
  {
    id: "linear",
    name: "Linear",
    description:
      "Create, update, and search Linear issues and projects via MCP.",
    version: "1.0.0",
    author: "gremlin",
    category: "productivity",
    icon: "linear",
    instructions: [
      "You have access to Linear tools via MCP.",
      "Use them to search issues, create tasks, and update project status.",
    ].join(" "),
    mcp: {
      transport: {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-linear"],
      },
    },
    requiredConnections: [
      {
        providerId: "linear",
        envMapping: { LINEAR_API_KEY: "accessToken" },
        reason: "Authenticate with Linear to manage issues and projects.",
        requiredScopes: ["read", "write"],
      },
    ],
    tags: ["productivity", "project-management"],
  },
  {
    id: "code-review",
    name: "Code Review",
    description:
      "Knowledge-only skill that adds code review best practices to the agent's context.",
    version: "1.0.0",
    author: "gremlin",
    category: "developer",
    icon: "code",
    instructions: [
      "When reviewing code, follow these best practices:",
      "1. Check for correctness, readability, and maintainability.",
      "2. Look for potential bugs, security vulnerabilities, and performance issues.",
      "3. Suggest improvements with clear explanations.",
      "4. Be constructive and respectful in feedback.",
      "5. Prioritize issues by severity: critical bugs > security > performance > style.",
    ].join("\n"),
    tags: ["developer", "code-quality"],
  },
  {
    id: "web-search",
    name: "Web Search",
    description:
      "Search the web using Brave Search to find up-to-date information, articles, and answers.",
    version: "1.0.0",
    author: "gremlin",
    category: "web",
    icon: "globe",
    instructions: [
      "You have access to web search tools via the Brave Search MCP server.",
      "Use them to find current information, answer factual questions, and research topics.",
      "Prefer specific, well-formed queries over vague ones.",
      "Summarize search results concisely and cite sources when possible.",
      "If the first query doesn't yield good results, refine and retry with different terms.",
    ].join(" "),
    mcp: {
      transport: {
        type: "stdio",
        command: "npx",
        args: ["-y", "@anthropic-ai/mcp-server-brave-search"],
      },
    },
    requiredConnections: [
      {
        providerId: "brave",
        envMapping: { BRAVE_API_KEY: "accessToken" },
        reason: "Authenticate with Brave Search to perform web queries.",
      },
    ],
    tags: ["web", "search", "research"],
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description:
      "Read, write, and search files in the sandbox via the filesystem MCP server.",
    version: "1.0.0",
    author: "gremlin",
    category: "developer",
    icon: "folder",
    mcp: {
      transport: {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      },
    },
    tags: ["developer", "files"],
  },
];

/** Look up a skill template by ID */
export function getSkillTemplate(id: string): SkillTemplate | undefined {
  return skillCatalog.find((s) => s.id === id);
}
