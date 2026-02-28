import type {
  Integration,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const mockIntegrations: Integration[] = [
  {
    id: "1",
    service: "GitHub",
    icon: "github",
    description: "Source code hosting and CI/CD",
    account: "marvinli",
    connectedAt: "2026-01-15T10:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      { scope: "repo:read", label: "Read repositories", enabled: true },
      { scope: "repo:write", label: "Write repositories", enabled: true },
      { scope: "actions", label: "Manage Actions", enabled: false },
    ],
  },
  {
    id: "2",
    service: "Slack",
    icon: "slack",
    description: "Team messaging and notifications",
    account: "workspace-gremlin",
    connectedAt: "2026-02-01T14:30:00Z",
    authMethod: "TOKEN",
    permissions: [
      { scope: "chat:write", label: "Send messages", enabled: true },
      { scope: "channels:read", label: "Read channels", enabled: true },
    ],
  },
  {
    id: "3",
    service: "Google Calendar",
    icon: "google-calendar",
    description: "Calendar and scheduling",
    account: "marvin@example.com",
    connectedAt: "2026-01-20T09:00:00Z",
    authMethod: "OAUTH",
    permissions: [
      { scope: "calendar:read", label: "Read events", enabled: true },
      { scope: "calendar:write", label: "Create events", enabled: false },
    ],
  },
];

const integrations: QueryResolvers["integrations"] = () => mockIntegrations;

const integration: QueryResolvers["integration"] = (_parent, { id }) =>
  mockIntegrations.find((i) => i.id === id) ?? null;

const togglePermission: MutationResolvers["togglePermission"] = (
  _parent,
  { integrationId, scope, enabled },
) => {
  const integ = mockIntegrations.find((i) => i.id === integrationId);
  if (!integ) throw new Error(`Integration ${integrationId} not found`);
  const perm = integ.permissions.find((p) => p.scope === scope);
  if (!perm) throw new Error(`Permission ${scope} not found`);
  perm.enabled = enabled;
  return integ;
};

export const integrationResolvers = {
  Query: { integrations, integration },
  Mutation: { togglePermission },
};
