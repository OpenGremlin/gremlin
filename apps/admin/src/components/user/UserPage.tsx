import { useState } from "react";
import { Link } from "react-router-dom";
import type { Integration, Notification, Skill } from "../../types";
import { gql } from "../../auth";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { Badge } from "../../shared/Badge";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import {
  INTEGRATIONS_QUERY,
  NOTIFICATIONS_QUERY,
  RESOLVE_NOTIFICATION,
  DISMISS_NOTIFICATION,
  SKILLS_QUERY,
} from "../../queries";

const pills = ["Notifications", "Integrations", "Skills", "Profile"] as const;
type Pill = (typeof pills)[number];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationCard({
  notification,
  onAction,
  onDismiss,
}: {
  notification: Notification;
  onAction: (notifId: string, actionId: string) => void;
  onDismiss: (notifId: string) => void;
}) {
  const resolved = notification.status !== "PENDING";
  const resolvedLabel = notification.actions.find(
    (a) => a.id === notification.resolvedAction,
  )?.label;

  return (
    <div
      className={`bg-neutral-900 rounded-xl p-4 ${resolved ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Link to={`/agents/${notification.agent.id}`} className="mt-0.5">
          <AgentAvatar src={notification.agent.imageUrl} name={notification.agent.name} status={notification.agent.status} size="xs" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Link
              to={`/agents/${notification.agent.id}`}
              className="text-sm font-medium text-neutral-100 hover:text-indigo-400 transition-colors"
            >
              {notification.agent.name}
            </Link>
            <span className="text-[11px] text-neutral-500 shrink-0 ml-2">
              {timeAgo(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-neutral-300 mb-3">
            {notification.message}
          </p>

          {resolved ? (
            <span className="text-xs text-neutral-500">
              {notification.status === "DISMISSED"
                ? "Dismissed"
                : resolvedLabel ?? "Resolved"}
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {notification.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onAction(notification.id, action.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    action.style === "primary"
                      ? "bg-indigo-500 text-white hover:bg-indigo-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors ml-1"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationsContent() {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useQuery<{
    notifications: Notification[];
  }>(NOTIFICATIONS_QUERY, { _v: version });

  const notifications = data?.notifications ?? [];

  async function handleAction(notifId: string, actionId: string) {
    await gql(RESOLVE_NOTIFICATION, { id: notifId, actionId });
    setVersion((v) => v + 1);
  }

  async function handleDismiss(notifId: string) {
    await gql(DISMISS_NOTIFICATION, { id: notifId });
    setVersion((v) => v + 1);
  }

  if (!loading && !error && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-sm text-neutral-500">
        No notifications yet
      </div>
    );
  }

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="flex flex-col gap-3 px-4 pb-4">
        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onAction={handleAction}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </>
  );
}

function IntegrationsContent() {
  const { data, loading, error } =
    useQuery<{ integrations: Integration[] }>(INTEGRATIONS_QUERY);

  const integrations = data?.integrations ?? [];

  return (
    <>
      <QueryResult loading={loading} error={error} />
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
    </>
  );
}

function SkillsContent() {
  const [query, setQuery] = useState("");
  const { data, loading, error } =
    useQuery<{ skills: Skill[] }>(SKILLS_QUERY);

  const skills = data?.skills ?? [];
  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 w-full"
        />
      </div>

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-4 pb-4">
        {filtered.map((skill) => (
          <Link
            key={skill.id}
            to={`/skills/${skill.id}`}
            className="bg-neutral-900 rounded-xl p-4 block transition-colors hover:bg-neutral-800/60"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-100">
                {skill.name}
              </h3>
              <Badge label={skill.installed ? "Installed" : "Available"} />
            </div>
            <p className="text-xs text-neutral-400 mb-2">{skill.description}</p>
            <span className="text-[11px] text-neutral-500">
              v{skill.version}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function ProfileContent() {
  return (
    <div className="flex items-center justify-center px-4 py-20 text-sm text-neutral-500">
      Coming soon
    </div>
  );
}

export function UserPage() {
  const [active, setActive] = useState<Pill>("Notifications");

  return (
    <div>
      <div className="flex gap-2 px-4 pt-4 pb-4 overflow-x-auto scrollbar-hide">
        {pills.map((pill) => (
          <button
            key={pill}
            onClick={() => setActive(pill)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === pill
                ? "bg-indigo-500 text-white"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {active === "Notifications" && <NotificationsContent />}
      {active === "Integrations" && <IntegrationsContent />}
      {active === "Skills" && <SkillsContent />}
      {active === "Profile" && <ProfileContent />}
    </div>
  );
}
