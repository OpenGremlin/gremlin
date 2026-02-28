import { Link } from "react-router-dom";
import type { Integration } from "../../types";
import { PageHeader } from "../../shared/PageHeader";

const integrations: Integration[] = [
  {
    id: "gmail",
    service: "Gmail",
    icon: "\u{1F4E7}",
    description: "Google email service for reading and sending mail.",
    account: "marvin@gmail.com",
    connectedAt: "2025-11-12T09:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      { scope: "gmail.read", label: "Read emails", enabled: true },
      { scope: "gmail.send", label: "Send emails", enabled: true },
      { scope: "gmail.delete", label: "Delete emails", enabled: false },
    ],
  },
  {
    id: "google-calendar",
    service: "Google Calendar",
    icon: "\u{1F4C5}",
    description: "Google calendar for viewing and managing events.",
    account: "marvin@gmail.com",
    connectedAt: "2025-11-12T09:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      { scope: "calendar.read", label: "View events", enabled: true },
      { scope: "calendar.write", label: "Create events", enabled: true },
      { scope: "calendar.delete", label: "Delete events", enabled: false },
    ],
  },
  {
    id: "slack",
    service: "Slack",
    icon: "\u{1F4AC}",
    description: "Team messaging and collaboration platform.",
    account: "marvin-li",
    connectedAt: "2025-10-28T14:30:00Z",
    authMethod: "TOKEN",
    permissions: [
      { scope: "channels.read", label: "Read channels", enabled: true },
      { scope: "chat.write", label: "Post messages", enabled: true },
      { scope: "reactions.write", label: "Add reactions", enabled: true },
    ],
  },
  {
    id: "github",
    service: "GitHub",
    icon: "\u{1F4BB}",
    description: "Code hosting and version control platform.",
    account: "marvin-li",
    connectedAt: "2025-09-15T11:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      { scope: "repo.read", label: "Read repositories", enabled: true },
      { scope: "repo.write", label: "Push commits", enabled: true },
      { scope: "issues.write", label: "Manage issues", enabled: true },
    ],
  },
  {
    id: "notion",
    service: "Notion",
    icon: "\u{1F4DD}",
    description: "Workspace for notes, docs, and databases.",
    account: "marvin@gmail.com",
    connectedAt: "2025-12-01T08:00:00Z",
    authMethod: "API_KEY",
    permissions: [
      { scope: "pages.read", label: "Read pages", enabled: true },
      { scope: "pages.write", label: "Edit pages", enabled: true },
      { scope: "databases.read", label: "Query databases", enabled: true },
    ],
  },
  {
    id: "spotify",
    service: "Spotify",
    icon: "\u{1F3B5}",
    description: "Music streaming and playback control.",
    account: "marvin.li",
    connectedAt: "2026-01-05T16:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      {
        scope: "user-read-playback",
        label: "View playback state",
        enabled: true,
      },
      {
        scope: "user-modify-playback",
        label: "Control playback",
        enabled: true,
      },
      {
        scope: "playlist-modify",
        label: "Modify playlists",
        enabled: false,
      },
    ],
  },
];

export { integrations };

export function IntegrationsPage() {
  return (
    <div>
      <PageHeader title="Integrations" />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {integrations.map((integration) => (
          <Link
            key={integration.id}
            to={`/integrations/${integration.id}`}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
          >
            <span className="text-3xl">{integration.icon}</span>
            <h3 className="text-sm font-medium text-neutral-100 mt-2">
              {integration.service}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {integration.account}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
