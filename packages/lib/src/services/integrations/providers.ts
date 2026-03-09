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
    models: [
      {
        id: "us.anthropic.claude-opus-4-6-v1",
        name: "Claude Opus 4.6",
        contextWindow: 200000,
        maxTokens: 32000,
        reasoning: true,
      },
      {
        id: "us.anthropic.claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
        maxTokens: 16000,
        reasoning: true,
      },
      {
        id: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
        maxTokens: 8192,
        reasoning: false,
      },
      {
        id: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        maxTokens: 16000,
        reasoning: true,
      },
      {
        id: "us.meta.llama4-maverick-17b-instruct-v1:0",
        name: "Llama 4 Maverick",
        contextWindow: 131072,
        maxTokens: 8192,
        reasoning: false,
      },
      {
        id: "us.meta.llama4-scout-17b-instruct-v1:0",
        name: "Llama 4 Scout",
        contextWindow: 131072,
        maxTokens: 8192,
        reasoning: false,
      },
      {
        id: "mistral.mistral-large-2411-v1:0",
        name: "Mistral Large",
        contextWindow: 131072,
        maxTokens: 8192,
        reasoning: false,
      },
    ],
  },
  {
    id: "anthropic",
    service: "Anthropic",
    category: "ai",
    description: "Claude models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "claude-opus-4-6",
        name: "Claude Opus 4.6",
        contextWindow: 200000,
        maxTokens: 32000,
        reasoning: true,
        inputCost: 5,
        outputCost: 25,
      },
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
        maxTokens: 16000,
        reasoning: true,
        inputCost: 3,
        outputCost: 15,
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 1,
        outputCost: 5,
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        maxTokens: 16000,
        reasoning: true,
        inputCost: 3,
        outputCost: 15,
      },
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        contextWindow: 200000,
        maxTokens: 32000,
        reasoning: true,
        inputCost: 15,
        outputCost: 75,
      },
    ],
  },
  {
    id: "openai",
    service: "OpenAI",
    category: "ai",
    description: "GPT & o-series models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        contextWindow: 1047576,
        maxTokens: 32768,
        reasoning: false,
        inputCost: 2,
        outputCost: 8,
      },
      {
        id: "o4-mini",
        name: "o4-mini",
        contextWindow: 200000,
        maxTokens: 100000,
        reasoning: true,
        inputCost: 1.1,
        outputCost: 4.4,
      },
      {
        id: "o3",
        name: "o3",
        contextWindow: 200000,
        maxTokens: 100000,
        reasoning: true,
        inputCost: 2,
        outputCost: 8,
      },
    ],
  },
  {
    id: "google_ai",
    service: "Google AI",
    category: "ai",
    description: "Gemini models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        contextWindow: 1048576,
        maxTokens: 65536,
        reasoning: true,
        inputCost: 1.25,
        outputCost: 10,
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        contextWindow: 1048576,
        maxTokens: 65536,
        reasoning: true,
        inputCost: 0.15,
        outputCost: 0.6,
      },
    ],
  },
  {
    id: "xai",
    service: "xAI",
    category: "ai",
    description: "Grok models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "grok-3",
        name: "Grok 3",
        contextWindow: 131072,
        maxTokens: 16384,
        reasoning: false,
        inputCost: 3,
        outputCost: 15,
      },
      {
        id: "grok-3-mini",
        name: "Grok 3 Mini",
        contextWindow: 131072,
        maxTokens: 16384,
        reasoning: true,
        inputCost: 0.3,
        outputCost: 0.5,
      },
    ],
  },
  {
    id: "mistral",
    service: "Mistral",
    category: "ai",
    description: "Mistral & Codestral models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        contextWindow: 131072,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 2,
        outputCost: 6,
      },
      {
        id: "codestral-latest",
        name: "Codestral",
        contextWindow: 262144,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 0.3,
        outputCost: 0.9,
      },
    ],
  },
  {
    id: "deepseek",
    service: "DeepSeek",
    category: "ai",
    description: "DeepSeek reasoning models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek-V3",
        contextWindow: 65536,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 0.27,
        outputCost: 1.1,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek-R1",
        contextWindow: 65536,
        maxTokens: 8192,
        reasoning: true,
        inputCost: 0.55,
        outputCost: 2.19,
      },
    ],
  },
  // Web
  {
    id: "brave",
    service: "Brave Search",
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
