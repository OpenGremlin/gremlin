import { useState } from "react";
import { gql } from "../../../auth";
import {
  DISMISS_NOTIFICATION,
  NOTIFICATIONS_QUERY,
  RESOLVE_NOTIFICATION,
} from "../../../queries";
import { QueryResult } from "../../../shared/QueryResult";
import type { Notification } from "../../../types";
import { useQuery } from "../../../useQuery";
import { NotificationCard } from "./NotificationCard";

export function NotificationsPage() {
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
