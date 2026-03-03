export type IntegrationCategory = "ai" | "productivity" | "communication" | "developer" | "entertainment" | "smart_home";

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
  connectionType: "oauth" | "apikey";
  availableScopes: AvailableScope[];
  models?: ModelDef[];
}

export const providers: IntegrationProviderDef[] = [
  // AI
  {
    id: "anthropic",
    service: "Anthropic",
    category: "ai",
    description: "Claude models",
    connectionType: "apikey",
    availableScopes: [],
    models: [
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        contextWindow: 200000,
        maxTokens: 32000,
        reasoning: true,
        inputCost: 15,
        outputCost: 75,
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
        id: "claude-haiku-3-5-20241022",
        name: "Claude Haiku 3.5",
        contextWindow: 200000,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 0.8,
        outputCost: 4,
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
    connectionType: "oauth",
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
    connectionType: "oauth",
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
    connectionType: "oauth",
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
    connectionType: "oauth",
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
    connectionType: "oauth",
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
    connectionType: "oauth",
    availableScopes: [
      { scope: "state:read", label: "Read Device State" },
      { scope: "service:call", label: "Control Devices" },
    ],
  },
];
