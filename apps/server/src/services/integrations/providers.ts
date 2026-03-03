export interface ProviderDef {
  id: string;
  service: string;
  description: string;
  scopes: { scope: string; label: string }[];
}

export const providers: ProviderDef[] = [
  {
    id: "google",
    service: "Google",
    description: "Gmail & Google Docs",
    scopes: [
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      { scope: "documents.readonly", label: "Read Google Docs" },
    ],
  },
  {
    id: "slack",
    service: "Slack",
    description: "Channels & Direct Messages",
    scopes: [
      { scope: "channels:read", label: "Read Channels" },
      { scope: "chat:write", label: "Send Messages" },
    ],
  },
  {
    id: "github",
    service: "GitHub",
    description: "Repositories & Issues",
    scopes: [
      { scope: "repo", label: "Access Repositories" },
      { scope: "issues:read", label: "Read Issues" },
    ],
  },
  {
    id: "spotify",
    service: "Spotify",
    description: "Playlists & Listening History",
    scopes: [
      { scope: "user-read-playback-state", label: "Read Playback State" },
      { scope: "playlist-read-private", label: "Read Private Playlists" },
    ],
  },
];
