import DiscordLogo from "@gremlin/logos/Discord.svg";
import GitHubLogo from "@gremlin/logos/GitHub.svg";
import GitHubLightLogo from "@gremlin/logos/GitHub_light.svg";
import GitLabLogo from "@gremlin/logos/GitLab.svg";
import GoogleLogo from "@gremlin/logos/Google.svg";
import JiraLogo from "@gremlin/logos/Jira.svg";
import LinearLogo from "@gremlin/logos/Linear.svg";
import LinearLightLogo from "@gremlin/logos/Linear_light.svg";
import NotionLogo from "@gremlin/logos/Notion.svg";
import SpotifyLogo from "@gremlin/logos/Spotify.svg";
import TeamsLogo from "@gremlin/logos/Teams.svg";

const logoImports: Record<string, string> = {
  "Google.svg": GoogleLogo,
  "Notion.svg": NotionLogo,
  "Linear.svg": LinearLogo,
  "Discord.svg": DiscordLogo,
  "Teams.svg": TeamsLogo,
  "GitHub.svg": GitHubLogo,
  "GitLab.svg": GitLabLogo,
  "Jira.svg": JiraLogo,
  "Spotify.svg": SpotifyLogo,
};

/** Light-mode overrides for logos that have a _light variant. */
const lightLogoImports: Record<string, string> = {
  "GitHub.svg": GitHubLightLogo,
  "Linear.svg": LinearLightLogo,
};

export function getLogoUrl(logo: string, isDark = true): string {
  if (!isDark && lightLogoImports[logo]) {
    return lightLogoImports[logo];
  }
  return logoImports[logo] ?? "";
}

export interface ProviderMeta {
  id: string;
  service: string;
  description: string;
  scopes: { scope: string; label: string }[];
  logo: string;
  defaultClientId?: string;
  defaultClientSecret?: string;
  tokenUrl: string;
  tokenAuthMethod?: "body" | "basic";
}

export const oauthProviders: ProviderMeta[] = [
  {
    id: "google",
    service: "Google",
    description: "Gmail & Google Docs",
    logo: "Google.svg",
    defaultClientId:
      "641099907982-t0ev4f32k7ghr5g3otf8m3mi4q29nf9j.apps.googleusercontent.com",
    defaultClientSecret: "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",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      { scope: "documents.readonly", label: "Read Google Docs" },
    ],
  },
  {
    id: "notion",
    service: "Notion",
    description: "Pages & Databases",
    logo: "Notion.svg",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    tokenAuthMethod: "basic",
    scopes: [
      { scope: "read_content", label: "Read Pages" },
      { scope: "insert_content", label: "Create Content" },
    ],
  },
  {
    id: "linear",
    service: "Linear",
    description: "Issues & Projects",
    logo: "Linear.svg",
    tokenUrl: "https://api.linear.app/oauth/token",
    scopes: [
      { scope: "read", label: "Read Issues" },
      { scope: "write", label: "Create & Update Issues" },
    ],
  },
  {
    id: "discord",
    service: "Discord",
    description: "Servers & Direct Messages",
    logo: "Discord.svg",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: [
      { scope: "guilds", label: "Access Servers" },
      { scope: "messages.read", label: "Read Messages" },
    ],
  },
  {
    id: "teams",
    service: "Microsoft Teams",
    description: "Chats & Channels",
    logo: "Teams.svg",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      { scope: "Chat.Read", label: "Read Chats" },
      { scope: "Chat.ReadWrite", label: "Send Messages" },
    ],
  },
  {
    id: "github",
    service: "GitHub",
    description: "Repositories & Issues",
    logo: "GitHub.svg",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: [
      { scope: "repo", label: "Access Repositories" },
      { scope: "issues:read", label: "Read Issues" },
    ],
  },
  {
    id: "gitlab",
    service: "GitLab",
    description: "Repositories & Merge Requests",
    logo: "GitLab.svg",
    tokenUrl: "https://gitlab.com/oauth/token",
    scopes: [
      { scope: "read_repository", label: "Read Repositories" },
      { scope: "api", label: "API Access" },
    ],
  },
  {
    id: "jira",
    service: "Jira",
    description: "Issues & Sprints",
    logo: "Jira.svg",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: [
      { scope: "read:jira-work", label: "Read Issues" },
      { scope: "write:jira-work", label: "Create & Update Issues" },
    ],
  },
  {
    id: "spotify",
    service: "Spotify",
    description: "Playlists & Listening History",
    logo: "Spotify.svg",
    defaultClientId: "c7d96c11accd4e3ebdaa9fcd32e9e1b6",
    defaultClientSecret: "bd7c953c3ce747288f231bc1abcf40e0",
    tokenUrl: "https://accounts.spotify.com/api/token",
    scopes: [
      { scope: "user-read-playback-state", label: "Read Playback State" },
      { scope: "playlist-read-private", label: "Read Private Playlists" },
    ],
  },
];
