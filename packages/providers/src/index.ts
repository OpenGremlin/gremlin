export type IntegrationCategory =
  | "ai"
  | "web"
  | "productivity"
  | "communication"
  | "developer"
  | "entertainment"
  | "cloud"
  | "smart_home";

export interface AvailableScope {
  scope: string;
  label: string;
}

export type ModelMode = "chat" | "image_generation" | "audio_speech";

/** @deprecated Use ModelMode instead */
export type ModelType = "llm" | "image";

export interface ModelDef {
  id: string;
  name: string;
  mode: ModelMode;
  maxInputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  supportedModalities?: string[];
  supportedOutputModalities?: string[];
  inputCostPerImage?: number;
  inputCostPerImageToken?: number;
  outputCostPerImage?: number;
  outputCostPerImageToken?: number;
}

export type UserInfoConfig =
  | { method: "id_token" }
  | {
      method: "rest";
      url: string;
      path: string;
      headers?: Record<string, string>;
      httpMethod?: "GET" | "POST";
    }
  | { method: "graphql"; url: string; query: string; path: string };

export interface OAuthPlatformOverride {
  /** Platform-specific OAuth client ID */
  clientId: string;
  /** Platform-specific redirect URI (e.g. reverse client ID scheme for iOS) */
  redirectUri: string;
}

export interface IntegrationProviderDef {
  id: string;
  service: string;
  category: IntegrationCategory;
  description: string;
  connectionType:
    | "oauth"
    | "apikey"
    | "model_provider"
    | "bedrock"
    | "aws_iam_role"
    | "custom";
  availableScopes: AvailableScope[];
  models?: ModelDef[];
  /** Hide from the UI — provider exists but is not ready for users yet */
  hidden?: boolean;
  /** Logo filename from @opengremlin/logos (e.g. "Google.svg") */
  logo: string;
  /** Light-mode logo variant filename, if available */
  logoLight?: string;
  /** OAuth authorization endpoint URL */
  authorizeUrl?: string;
  /** OAuth token endpoint URL */
  tokenUrl?: string;
  /** Public OAuth app key shipped with the client */
  defaultClientId?: string;
  /** Default scopes to always request */
  defaultScopes?: string[];
  /** Prefix to prepend to user-selected scopes */
  scopePrefix?: string;
  /** Extra query params for the authorization URL */
  extraAuthParams?: Record<string, string>;
  /** How to resolve the connected account identity after OAuth */
  userInfo?: UserInfoConfig;
  /** iOS-specific OAuth client override (e.g. Google iOS client with reverse client ID redirect) */
  ios?: OAuthPlatformOverride;
  /** Android-specific OAuth client override */
  android?: OAuthPlatformOverride;
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
    connectionType: "model_provider",
    logo: "Anthropic.svg",
    logoLight: "Anthropic_light.svg",
    availableScopes: [],
  },
  {
    id: "openai",
    service: "OpenAI",
    category: "ai",
    description: "ChatGPT models",
    connectionType: "model_provider",
    logo: "OpenAI.svg",
    logoLight: "OpenAI_light.svg",
    availableScopes: [],
  },
  {
    id: "google_ai",
    service: "Google AI",
    category: "ai",
    description: "Gemini models",
    connectionType: "model_provider",
    logo: "Gemini.svg",
    availableScopes: [],
  },
  {
    id: "xai",
    service: "xAI",
    category: "ai",
    description: "Grok models",
    connectionType: "model_provider",
    logo: "xAI.svg",
    logoLight: "xAI_light.svg",
    availableScopes: [],
  },
  {
    id: "mistral",
    service: "Mistral",
    category: "ai",
    description: "Mistral chat & code models",
    connectionType: "model_provider",
    logo: "Mistral.svg",
    availableScopes: [],
  },
  {
    id: "deepseek",
    service: "DeepSeek",
    category: "ai",
    description: "DeepSeek models",
    connectionType: "model_provider",
    logo: "DeepSeek.svg",
    availableScopes: [],
  },
  {
    id: "groq",
    service: "Groq",
    category: "ai",
    description: "Fast open-source model inference",
    connectionType: "model_provider",
    logo: "Groq.svg",
    logoLight: "Groq_light.svg",
    availableScopes: [],
  },
  {
    id: "perplexity",
    service: "Perplexity",
    category: "ai",
    description: "Search-powered Sonar models",
    connectionType: "model_provider",
    logo: "Perplexity.svg",
    availableScopes: [],
  },
  {
    id: "together",
    service: "Together AI",
    category: "ai",
    description: "Open-source model hosting",
    connectionType: "model_provider",
    logo: "TogetherAI.svg",
    availableScopes: [],
  },
  {
    id: "fireworks",
    service: "Fireworks AI",
    category: "ai",
    description: "Open-source model inference",
    connectionType: "model_provider",
    logo: "FireworksAI.svg",
    availableScopes: [],
  },
  {
    id: "cohere",
    service: "Cohere",
    category: "ai",
    description: "Cohere models",
    connectionType: "model_provider",
    logo: "Cohere.svg",
    availableScopes: [],
  },
  {
    id: "minimax",
    service: "MiniMax",
    category: "ai",
    description: "MiniMax models",
    connectionType: "model_provider",
    logo: "MiniMax.svg",
    availableScopes: [],
  },
  {
    id: "qwen",
    service: "Qwen",
    category: "ai",
    description: "Qwen models via DashScope",
    connectionType: "model_provider",
    logo: "Qwen.svg",
    availableScopes: [],
  },
  {
    id: "elevenlabs",
    service: "ElevenLabs",
    category: "ai",
    description: "Speech synthesis models",
    connectionType: "model_provider",
    logo: "ElevenLabs.svg",
    logoLight: "ElevenLabs_light.svg",
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
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    defaultClientId:
      "641099907982-k16ejd03g4efigpcdbknrg9vmghnkm5h.apps.googleusercontent.com",
    ios: {
      clientId:
        "641099907982-k16ejd03g4efigpcdbknrg9vmghnkm5h.apps.googleusercontent.com",
      redirectUri:
        "com.googleusercontent.apps.641099907982-k16ejd03g4efigpcdbknrg9vmghnkm5h:/oauthredirect",
    },
    defaultScopes: ["openid", "email"],
    scopePrefix: "https://www.googleapis.com/auth/",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
    userInfo: { method: "id_token" },
    availableScopes: [
      // Gmail
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      // Calendar
      { scope: "calendar.readonly", label: "Read Calendar" },
      { scope: "calendar.events", label: "Manage Calendar Events" },
      // Docs
      { scope: "documents.readonly", label: "Read Google Docs" },
      { scope: "documents", label: "Edit Google Docs" },
      // Drive
      { scope: "drive.readonly", label: "Read Google Drive" },
      { scope: "drive.file", label: "Manage Google Drive Files" },
      // Sheets
      { scope: "spreadsheets.readonly", label: "Read Google Sheets" },
      { scope: "spreadsheets", label: "Edit Google Sheets" },
      // Slides
      { scope: "presentations.readonly", label: "Read Google Slides" },
      { scope: "presentations", label: "Edit Google Slides" },
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
    authorizeUrl: "https://linear.app/oauth/authorize",
    tokenUrl: "https://api.linear.app/oauth/token",
    userInfo: {
      method: "graphql",
      url: "https://api.linear.app/graphql",
      query: "{ viewer { email } }",
      path: "data.viewer.email",
    },
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
    authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    defaultClientId: "i1lwuckf843zcf0",
    extraAuthParams: { token_access_type: "offline" },
    userInfo: {
      method: "rest",
      url: "https://api.dropboxapi.com/2/users/get_current_account",
      path: "email",
      httpMethod: "POST",
    },
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
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    defaultScopes: ["identify", "email"],
    userInfo: {
      method: "rest",
      url: "https://discord.com/api/users/@me",
      path: "email",
    },
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
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    defaultScopes: ["openid", "email", "offline_access"],
    scopePrefix: "https://graph.microsoft.com/",
    userInfo: {
      method: "rest",
      url: "https://graph.microsoft.com/v1.0/me",
      path: "mail",
    },
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
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    defaultClientId: "Ov23lifJONH8V9JAhnBe",
    userInfo: {
      method: "rest",
      url: "https://api.github.com/user",
      path: "login",
    },
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
    authorizeUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    userInfo: {
      method: "rest",
      url: "https://gitlab.com/api/v4/user",
      path: "email",
    },
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
    authorizeUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    extraAuthParams: { audience: "api.atlassian.com", prompt: "consent" },
    userInfo: {
      method: "rest",
      url: "https://api.atlassian.com/me",
      path: "email",
    },
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
    authorizeUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    defaultClientId: "c7d96c11accd4e3ebdaa9fcd32e9e1b6",
    defaultScopes: ["user-read-email"],
    userInfo: {
      method: "rest",
      url: "https://api.spotify.com/v1/me",
      path: "email",
    },
    availableScopes: [
      // Playlists
      { scope: "playlist-read-private", label: "Read Private Playlists" },
      {
        scope: "playlist-read-collaborative",
        label: "Read Collaborative Playlists",
      },
      { scope: "playlist-modify-public", label: "Edit Public Playlists" },
      { scope: "playlist-modify-private", label: "Edit Private Playlists" },
      // Playback
      { scope: "user-read-playback-state", label: "Read Playback State" },
      { scope: "user-modify-playback-state", label: "Control Playback" },
      { scope: "user-read-currently-playing", label: "Read Currently Playing" },
      { scope: "streaming", label: "Stream Audio (Premium)" },
      // Library & History
      { scope: "user-read-recently-played", label: "Read Recently Played" },
      { scope: "user-library-read", label: "Read Saved Library" },
      { scope: "user-library-modify", label: "Edit Saved Library" },
    ],
  },
  // Cloud
  {
    id: "aws",
    service: "AWS",
    category: "cloud",
    description: "Connect to an AWS account via IAM Role",
    connectionType: "aws_iam_role",
    logo: "AWS.svg",
    logoLight: "AWS_light.svg",
    availableScopes: [],
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
