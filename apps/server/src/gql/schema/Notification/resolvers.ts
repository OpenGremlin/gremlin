import {
  type MutationResolvers,
  type NotificationResolvers,
  NotificationStatus,
  NotificationType,
  type QueryResolvers,
} from "../../resolverTypes.js";
import { requireAgent } from "../Agent/resolvers.js";

export interface NotificationModel {
  id: string;
  agentId: string;
  type: NotificationType;
  turnId: string | null;
  message: string;
  actions: { id: string; label: string; style: string }[];
  status: NotificationStatus;
  resolvedAction: string | null;
  createdAt: string;
}

const mockNotifications: NotificationModel[] = [
  {
    id: "notif-1",
    agentId: "clawd",
    type: NotificationType.Suggestion,
    turnId: "turn-5",
    message:
      "I can play music during your focus sessions. Want to connect your Spotify account?",
    actions: [
      { id: "connect", label: "Connect Spotify", style: "primary" },
      { id: "skip", label: "Not now", style: "secondary" },
    ],
    status: NotificationStatus.Pending,
    resolvedAction: null,
    createdAt: "2026-02-28T14:30:00Z",
  },
  {
    id: "notif-2",
    agentId: "nyx",
    type: NotificationType.Approval,
    turnId: "turn-3",
    message:
      'I found 3 outdated dependencies in the project. Should I open a PR to update them?',
    actions: [
      { id: "approve", label: "Go ahead", style: "primary" },
      { id: "reject", label: "Skip", style: "secondary" },
    ],
    status: NotificationStatus.Pending,
    resolvedAction: null,
    createdAt: "2026-02-28T13:15:00Z",
  },
  {
    id: "notif-3",
    agentId: "flicker",
    type: NotificationType.Permission,
    turnId: "turn-2",
    message:
      "I need access to your Google Calendar to schedule the weekly sync you asked about.",
    actions: [
      { id: "grant", label: "Allow", style: "primary" },
      { id: "deny", label: "Deny", style: "secondary" },
    ],
    status: NotificationStatus.Resolved,
    resolvedAction: "grant",
    createdAt: "2026-02-28T10:00:00Z",
  },
  {
    id: "notif-4",
    agentId: "moss",
    type: NotificationType.Input,
    turnId: "turn-1",
    message:
      "I'm setting up your morning briefing. Which topics should I cover?",
    actions: [
      { id: "news", label: "News", style: "secondary" },
      { id: "weather", label: "Weather", style: "secondary" },
      { id: "calendar", label: "Calendar", style: "secondary" },
    ],
    status: NotificationStatus.Pending,
    resolvedAction: null,
    createdAt: "2026-02-28T09:00:00Z",
  },
  {
    id: "notif-5",
    agentId: "jinx",
    type: NotificationType.Approval,
    turnId: "turn-4",
    message:
      "Your API rate limit hit 80% today. Want me to enable request throttling?",
    actions: [
      { id: "approve", label: "Enable", style: "primary" },
      { id: "reject", label: "Ignore", style: "secondary" },
    ],
    status: NotificationStatus.Dismissed,
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
  n.status = NotificationStatus.Resolved;
  n.resolvedAction = actionId;
  return n;
};

const dismissNotification: MutationResolvers["dismissNotification"] = (
  _parent,
  { id },
) => {
  const n = mockNotifications.find((n) => n.id === id);
  if (!n) throw new Error(`Notification ${id} not found`);
  n.status = NotificationStatus.Dismissed;
  return n;
};

const agent: NotificationResolvers["agent"] = (parent) =>
  requireAgent(parent.agentId);

export const notificationResolvers = {
  Query: { notifications },
  Mutation: { resolveNotification, dismissNotification },
  Notification: { agent },
};
