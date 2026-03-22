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
  /** Logo filename from @gremlin/logos (e.g. "Google.svg") */
  logo: string;
  /** Light-mode logo variant filename, if available */
  logoLight?: string;
  /** OAuth token endpoint URL */
  tokenUrl?: string;
  /** Public OAuth app key shipped with the client */
  defaultClientId?: string;
}

export const providers: IntegrationProviderDef[] = [
  // AI
  {
    id: "bedrock",
    service: "AWS Bedrock",
    category: "ai",
    description: "Server-side AWS models",
    connectionType: "bedrock",
    logo: "Bedrock.svg",
    availableScopes: [],
  },
  {
    id: "anthropic",
    service: "Anthropic",
    category: "ai",
    description: "Claude models",
    connectionType: "apikey",
    logo: "Anthropic.svg",
    logoLight: "Anthropic_light.svg",
    availableScopes: [],
  },
  {
    id: "openai",
    service: "OpenAI",
    category: "ai",
    description: "ChatGPT models",
    connectionType: "apikey",
    logo: "OpenAI.svg",
    logoLight: "OpenAI_light.svg",
    availableScopes: [],
  },
  {
    id: "google_ai",
    service: "Google AI",
    category: "ai",
    description: "Gemini models",
    connectionType: "apikey",
    logo: "Gemini.svg",
    availableScopes: [],
  },
  {
    id: "xai",
    service: "xAI",
    category: "ai",
    description: "Grok models",
    connectionType: "apikey",
    logo: "xAI.svg",
    logoLight: "xAI_light.svg",
    availableScopes: [],
  },
  {
    id: "mistral",
    service: "Mistral",
    category: "ai",
    description: "Mistral chat & code models",
    connectionType: "apikey",
    logo: "Mistral.svg",
    availableScopes: [],
  },
  {
    id: "deepseek",
    service: "DeepSeek",
    category: "ai",
    description: "DeepSeek models",
    connectionType: "apikey",
    logo: "DeepSeek.svg",
    availableScopes: [],
  },
  {
    id: "groq",
    service: "Groq",
    category: "ai",
    description: "Fast open-source model inference",
    connectionType: "apikey",
    logo: "Groq.svg",
    logoLight: "Groq_light.svg",
    availableScopes: [],
  },
  {
    id: "perplexity",
    service: "Perplexity",
    category: "ai",
    description: "Search-powered Sonar models",
    connectionType: "apikey",
    logo: "Perplexity.svg",
    availableScopes: [],
  },
  {
    id: "together",
    service: "Together AI",
    category: "ai",
    description: "Open-source model hosting",
    connectionType: "apikey",
    logo: "TogetherAI.svg",
    availableScopes: [],
  },
  {
    id: "fireworks",
    service: "Fireworks AI",
    category: "ai",
    description: "Open-source model inference",
    connectionType: "apikey",
    logo: "FireworksAI.svg",
    availableScopes: [],
  },
  {
    id: "cohere",
    service: "Cohere",
    category: "ai",
    description: "Cohere models",
    connectionType: "apikey",
    logo: "Cohere.svg",
    availableScopes: [],
  },
  {
    id: "minimax",
    service: "MiniMax",
    category: "ai",
    description: "MiniMax models",
    connectionType: "apikey",
    logo: "MiniMax.svg",
    availableScopes: [],
  },
  {
    id: "qwen",
    service: "Qwen",
    category: "ai",
    description: "Qwen models via DashScope",
    connectionType: "apikey",
    logo: "Qwen.svg",
    availableScopes: [],
  },
  // Web
  {
    id: "brave",
    service: "Brave",
    category: "web",
    description: "Web search via Brave Search API",
    connectionType: "apikey",
    logo: "Brave.svg",
    availableScopes: [],
  },
  {
    id: "tavily",
    service: "Tavily",
    category: "web",
    description: "AI-optimized web search API",
    connectionType: "apikey",
    logo: "Tavily.svg",
    availableScopes: [],
  },
  // Productivity
  {
    id: "google",
    service: "Google",
    category: "productivity",
    description: "Gmail & Google Docs",
    connectionType: "oauth",
    logo: "Google.svg",
    tokenUrl: "https://oauth2.googleapis.com/token",
    defaultClientId:
      "641099907982-t0ev4f32k7ghr5g3otf8m3mi4q29nf9j.apps.googleusercontent.com",
    availableScopes: [
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      { scope: "documents.readonly", label: "Read Google Docs" },
    ],
  },
  {
    id: "linear",
    service: "Linear",
    category: "productivity",
    description: "Issues & Projects",
    connectionType: "oauth",
    logo: "Linear.svg",
    logoLight: "Linear_light.svg",
    tokenUrl: "https://api.linear.app/oauth/token",
    hidden: true,
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
    logo: "Trello.svg",
    hidden: true,
    availableScopes: [
      { scope: "read", label: "Read Boards" },
      { scope: "write", label: "Create & Move Cards" },
    ],
  },
  {
    id: "dropbox",
    service: "Dropbox",
    category: "productivity",
    description: "Files & Cloud Storage",
    connectionType: "oauth",
    logo: "Dropbox.svg",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    defaultClientId: "i1lwuckf843zcf0",
    availableScopes: [
      { scope: "account_info.read", label: "View Account Info" },
      { scope: "files.metadata.read", label: "Read File Metadata" },
      { scope: "files.metadata.write", label: "Edit File Metadata" },
      { scope: "files.content.read", label: "Read File Content" },
      { scope: "files.content.write", label: "Write Files" },
      { scope: "sharing.read", label: "View Sharing Settings" },
      { scope: "sharing.write", label: "Manage Sharing Settings" },
      { scope: "file_requests.read", label: "View File Requests" },
      { scope: "file_requests.write", label: "Manage File Requests" },
      { scope: "contacts.read", label: "View Contacts" },
      { scope: "contacts.write", label: "Manage Contacts" },
    ],
  },
  // Communication
  {
    id: "slack",
    service: "Slack",
    category: "communication",
    description: "Channels & Direct Messages",
    connectionType: "custom",
    logo: "Slack.svg",
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
    logo: "Discord.svg",
    tokenUrl: "https://discord.com/api/oauth2/token",
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
    logo: "Teams.svg",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
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
    logo: "Telegram.svg",
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
    logo: "WhatsApp.svg",
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
    logo: "GitHub.svg",
    logoLight: "GitHub_light.svg",
    tokenUrl: "https://github.com/login/oauth/access_token",
    defaultClientId: "Ov23lifJONH8V9JAhnBe",
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
    logo: "GitLab.svg",
    tokenUrl: "https://gitlab.com/oauth/token",
    hidden: true,
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
    logo: "Jira.svg",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    hidden: true,
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
    logo: "Spotify.svg",
    tokenUrl: "https://accounts.spotify.com/api/token",
    defaultClientId: "c7d96c11accd4e3ebdaa9fcd32e9e1b6",
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
    logo: "Hue.svg",
    hidden: true,
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
    logo: "HomeAssistant.svg",
    hidden: true,
    availableScopes: [
      { scope: "state:read", label: "Read Device State" },
      { scope: "service:call", label: "Control Devices" },
    ],
  },
];
