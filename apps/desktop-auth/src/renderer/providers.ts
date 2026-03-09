export interface ProviderMeta {
  id: string;
  service: string;
  description: string;
  scopes: { scope: string; label: string }[];
  logo: string;
}

export const oauthProviders: ProviderMeta[] = [
  {
    id: "google",
    service: "Google",
    description: "Gmail & Google Docs",
    logo: "Google.svg",
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
    scopes: [
      { scope: "user-read-playback-state", label: "Read Playback State" },
      { scope: "playlist-read-private", label: "Read Private Playlists" },
    ],
  },
];
