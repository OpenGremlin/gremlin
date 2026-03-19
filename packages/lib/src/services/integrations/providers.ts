export type IntegrationCategory =
  | "ai"
  | "web"
  | "productivity"
  | "communication"
  | "developer"
  | "entertainment"
  | "smart_home";

export interface AvailableScope {
  scope: string;
  label: string;
}

export interface ModelDef {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  inputCost?: number;
  outputCost?: number;
}

export interface IntegrationProviderDef {
  id: string;
  service: string;
  category: IntegrationCategory;
  description: string;
  connectionType: "oauth" | "apikey" | "bedrock" | "custom";
  availableScopes: AvailableScope[];
  models?: ModelDef[];
  /** Hide from the UI — provider exists but is not ready for users yet */
  hidden?: boolean;
}

export const providers: IntegrationProviderDef[] = [
  // AI
  {
    id: "bedrock",
    service: "AWS Bedrock",
    category: "ai",
    description: "Server-side AWS models",
    connectionType: "bedrock",
    availableScopes: [],
  },
  {
    id: "anthropic",
    service: "Anthropic",
    category: "ai",
    description: "Claude models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "openai",
    service: "OpenAI",
    category: "ai",
    description: "ChatGPT models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "google_ai",
    service: "Google AI",
    category: "ai",
    description: "Gemini models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "xai",
    service: "xAI",
    category: "ai",
    description: "Grok models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "mistral",
    service: "Mistral",
    category: "ai",
    description: "Mistral chat & code models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "deepseek",
    service: "DeepSeek",
    category: "ai",
    description: "DeepSeek models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "groq",
    service: "Groq",
    category: "ai",
    description: "Fast open-source model inference",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "perplexity",
    service: "Perplexity",
    category: "ai",
    description: "Search-powered Sonar models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "together",
    service: "Together AI",
    category: "ai",
    description: "Open-source model hosting",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "fireworks",
    service: "Fireworks AI",
    category: "ai",
    description: "Open-source model inference",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "cohere",
    service: "Cohere",
    category: "ai",
    description: "Cohere models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "minimax",
    service: "MiniMax",
    category: "ai",
    description: "MiniMax models",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "qwen",
    service: "Qwen",
    category: "ai",
    description: "Qwen models via DashScope",
    connectionType: "apikey",
    availableScopes: [],
  },
  // Web
  {
    id: "brave",
    service: "Brave",
    category: "web",
    description: "Web search via Brave Search API",
    connectionType: "apikey",
    availableScopes: [],
  },
  {
    id: "tavily",
    service: "Tavily",
    category: "web",
    description: "AI-optimized web search API",
    connectionType: "apikey",
    availableScopes: [],
  },
  // Productivity
  {
    id: "google",
    service: "Google",
    category: "productivity",
    description: "Gmail & Google Docs",
    connectionType: "oauth",
    availableScopes: [
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      { scope: "documents.readonly", label: "Read Google Docs" },
    ],
  },
  {
    id: "notion",
    service: "Notion",
    category: "productivity",
    description: "Pages & Databases",
    connectionType: "oauth",
    availableScopes: [
      { scope: "read_content", label: "Read Pages" },
      { scope: "insert_content", label: "Create Content" },
    ],
  },
  {
    id: "linear",
    service: "Linear",
    category: "productivity",
    description: "Issues & Projects",
    connectionType: "oauth",
    availableScopes: [
      { scope: "read", label: "Read Issues" },
      { scope: "write", label: "Create & Update Issues" },
    ],
  },
  {
    id: "trello",
    service: "Trello",
    category: "productivity",
    description: "Boards & Cards",
    connectionType: "custom",
    availableScopes: [
      { scope: "read", label: "Read Boards" },
      { scope: "write", label: "Create & Move Cards" },
    ],
  },
  // Communication
  {
    id: "slack",
    service: "Slack",
    category: "communication",
    description: "Channels & Direct Messages",
    connectionType: "custom",
    hidden: true,
    availableScopes: [
      { scope: "channels:read", label: "Read Channels" },
      { scope: "chat:write", label: "Send Messages" },
    ],
  },
  {
    id: "discord",
    service: "Discord",
    category: "communication",
    description: "Servers & Direct Messages",
    connectionType: "oauth",
    hidden: true,
    availableScopes: [
      { scope: "guilds", label: "Access Servers" },
      { scope: "messages.read", label: "Read Messages" },
    ],
  },
  {
    id: "teams",
    service: "Microsoft Teams",
    category: "communication",
    description: "Chats & Channels",
    connectionType: "oauth",
    hidden: true,
    availableScopes: [
      { scope: "Chat.Read", label: "Read Chats" },
      { scope: "Chat.ReadWrite", label: "Send Messages" },
    ],
  },
  {
    id: "telegram",
    service: "Telegram",
    category: "communication",
    description: "Chats & Channels",
    connectionType: "custom",
    hidden: true,
    availableScopes: [
      { scope: "messages:read", label: "Read Messages" },
      { scope: "messages:send", label: "Send Messages" },
    ],
  },
  {
    id: "whatsapp",
    service: "WhatsApp",
    category: "communication",
    description: "Messages & Groups",
    connectionType: "custom",
    hidden: true,
    availableScopes: [
      { scope: "messages:read", label: "Read Messages" },
      { scope: "messages:send", label: "Send Messages" },
    ],
  },
  // Developer
  {
    id: "github",
    service: "GitHub",
    category: "developer",
    description: "Repositories & Issues",
    connectionType: "oauth",
    availableScopes: [
      { scope: "repo", label: "Access Repositories" },
      { scope: "issues:read", label: "Read Issues" },
    ],
  },
  {
    id: "gitlab",
    service: "GitLab",
    category: "developer",
    description: "Repositories & Merge Requests",
    connectionType: "oauth",
    availableScopes: [
      { scope: "read_repository", label: "Read Repositories" },
      { scope: "api", label: "API Access" },
    ],
  },
  {
    id: "jira",
    service: "Jira",
    category: "developer",
    description: "Issues & Sprints",
    connectionType: "oauth",
    availableScopes: [
      { scope: "read:jira-work", label: "Read Issues" },
      { scope: "write:jira-work", label: "Create & Update Issues" },
    ],
  },
  // Entertainment
  {
    id: "spotify",
    service: "Spotify",
    category: "entertainment",
    description: "Playlists & Listening History",
    connectionType: "oauth",
    availableScopes: [
      { scope: "user-read-playback-state", label: "Read Playback State" },
      { scope: "playlist-read-private", label: "Read Private Playlists" },
    ],
  },
  // Smart Home
  {
    id: "hue",
    service: "Philips Hue",
    category: "smart_home",
    description: "Lights & Scenes",
    connectionType: "custom",
    availableScopes: [
      { scope: "lights:read", label: "Read Light State" },
      { scope: "lights:write", label: "Control Lights" },
    ],
  },
  {
    id: "homeassistant",
    service: "Home Assistant",
    category: "smart_home",
    description: "Devices & Automations",
    connectionType: "custom",
    availableScopes: [
      { scope: "state:read", label: "Read Device State" },
      { scope: "service:call", label: "Control Devices" },
    ],
  },
];
