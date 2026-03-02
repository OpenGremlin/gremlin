import { gql } from "../../../auth";
import {
  DismissNotificationMutation,
  NotificationsQuery,
  ResolveNotificationMutation,
} from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { NotificationCard } from "./NotificationCard";

export function NotificationsPage() {
  const { data, loading, error, refetch } = useQuery(NotificationsQuery);

  const notifications = data?.notifications ?? [];

  async function handleAction(notifId: string, actionId: string) {
    await gql(ResolveNotificationMutation, { id: notifId, actionId });
    refetch();
  }

  async function handleDismiss(notifId: string) {
    await gql(DismissNotificationMutation, { id: notifId });
    refetch();
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
