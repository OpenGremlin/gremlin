import type {
  MutationResolvers,
  QueryResolvers,
  NotificationResolvers,
} from "../../resolverTypes.js";
import { findAgent } from "../Agent/resolvers.js";

export interface NotificationModel {
  id: string;
  agentId: string;
  type: "PERMISSION" | "APPROVAL" | "INPUT" | "SUGGESTION";
  message: string;
  actions: { id: string; label: string; style: string }[];
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolvedAction: string | null;
  createdAt: string;
}

const mockNotifications: NotificationModel[] = [
  {
    id: "notif-1",
    agentId: "clawd",
    type: "SUGGESTION",
    message:
      "I can play music during your focus sessions. Want to connect your Spotify account?",
    actions: [
      { id: "connect", label: "Connect Spotify", style: "primary" },
      { id: "skip", label: "Not now", style: "secondary" },
    ],
    status: "PENDING",
    resolvedAction: null,
    createdAt: "2026-02-28T14:30:00Z",
  },
  {
    id: "notif-2",
    agentId: "nyx",
    type: "APPROVAL",
    message:
      'I found 3 outdated dependencies in the project. Should I open a PR to update them?',
    actions: [
      { id: "approve", label: "Go ahead", style: "primary" },
      { id: "reject", label: "Skip", style: "secondary" },
    ],
    status: "PENDING",
    resolvedAction: null,
    createdAt: "2026-02-28T13:15:00Z",
  },
  {
    id: "notif-3",
    agentId: "flicker",
    type: "PERMISSION",
    message:
      "I need access to your Google Calendar to schedule the weekly sync you asked about.",
    actions: [
      { id: "grant", label: "Allow", style: "primary" },
      { id: "deny", label: "Deny", style: "secondary" },
    ],
    status: "RESOLVED",
    resolvedAction: "grant",
    createdAt: "2026-02-28T10:00:00Z",
  },
  {
    id: "notif-4",
    agentId: "moss",
    type: "INPUT",
    message:
      "I'm setting up your morning briefing. Which topics should I cover?",
    actions: [
      { id: "news", label: "News", style: "secondary" },
      { id: "weather", label: "Weather", style: "secondary" },
      { id: "calendar", label: "Calendar", style: "secondary" },
    ],
    status: "PENDING",
    resolvedAction: null,
    createdAt: "2026-02-28T09:00:00Z",
  },
  {
    id: "notif-5",
    agentId: "jinx",
    type: "APPROVAL",
    message:
      "Your API rate limit hit 80% today. Want me to enable request throttling?",
    actions: [
      { id: "approve", label: "Enable", style: "primary" },
      { id: "reject", label: "Ignore", style: "secondary" },
    ],
    status: "DISMISSED",
    resolvedAction: null,
    createdAt: "2026-02-27T22:45:00Z",
  },
];

const notifications: QueryResolvers["notifications"] = () =>
  mockNotifications;

const resolveNotification: MutationResolvers["resolveNotification"] = (
  _parent,
  { id, actionId },
) => {
  const n = mockNotifications.find((n) => n.id === id);
  if (!n) throw new Error(`Notification ${id} not found`);
  n.status = "RESOLVED";
  n.resolvedAction = actionId;
  return n;
};

const dismissNotification: MutationResolvers["dismissNotification"] = (
  _parent,
  { id },
) => {
  const n = mockNotifications.find((n) => n.id === id);
  if (!n) throw new Error(`Notification ${id} not found`);
  n.status = "DISMISSED";
  return n;
};

const agent: NotificationResolvers["agent"] = (parent) => {
  const a = findAgent(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const notificationResolvers = {
  Query: { notifications },
  Mutation: { resolveNotification, dismissNotification },
  Notification: { agent },
};
