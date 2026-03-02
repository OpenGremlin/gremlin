import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import type { NotificationsQuery } from "../../../../graphql/generated/graphql";
import { AgentAvatar } from "../../../../shared/AgentAvatar";
import { timeAgo } from "../../../../shared/formatDate";

type Notification = NotificationsQuery["notifications"][number];

export function NotificationCard({
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

  const chatLink = `/agents/${notification.agent.id}${notification.turnId ? `#${notification.turnId}` : ""}`;

  return (
    <div
      className={`bg-neutral-900 rounded-xl p-4 ${resolved ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Link to={chatLink} className="mt-0.5">
          <AgentAvatar id={notification.agent.id} size="xs" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Link
              to={chatLink}
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
                : (resolvedLabel ?? "Resolved")}
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {notification.actions.map((action) => (
                <button
                  type="button"
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
                type="button"
                onClick={() => onDismiss(notification.id)}
                className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors ml-1"
              >
                Dismiss
              </button>
            </div>
          )}

          <Link
            to={chatLink}
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-indigo-400 transition-colors mt-3 float-right"
          >
            Go to conversation
            <MessageSquare size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
