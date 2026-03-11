import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NotificationsQuery as NotificationsQueryType } from "../../../src/graphql/generated/graphql";
import {
  DismissNotificationMutation,
  NotificationsQuery,
  ResolveNotificationMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { EmptyState } from "../../../src/shared/EmptyState";
import { timeAgo } from "../../../src/shared/formatDate";
import { QueryResult } from "../../../src/shared/QueryResult";

type Notification = NotificationsQueryType["notifications"][number];

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
    <Pressable
      onPress={() => router.push(`/agents/${notification.agent.id}`)}
      className={`bg-neutral-900 rounded-xl p-4 ${resolved ? "opacity-40" : ""}`}
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5">
          <AgentAvatar id={notification.agent.id} size={36} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-neutral-100">
              {notification.agent.name}
            </Text>
            <Text className="text-[11px] text-neutral-500 shrink ml-2">
              {timeAgo(notification.createdAt)}
            </Text>
          </View>
          <Text className="text-sm text-neutral-300 mb-3">
            {notification.message}
          </Text>

          {resolved ? (
            <Text className="text-xs text-neutral-500">
              {notification.status === "DISMISSED"
                ? "Dismissed"
                : (resolvedLabel ?? "Resolved")}
            </Text>
          ) : (
            <View className="flex-row items-center gap-2 flex-wrap">
              {notification.actions.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={(e) => {
                    e.stopPropagation();
                    onAction(notification.id, action.id);
                  }}
                  className={`rounded-full px-3 py-1 ${
                    action.style === "primary"
                      ? "bg-indigo-500"
                      : "bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      action.style === "primary"
                        ? "text-white"
                        : "text-neutral-300"
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                className="ml-1"
              >
                <Text className="text-xs text-neutral-500">Dismiss</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { data, loading, error, refetch } = useQuery(NotificationsQuery);

  const notifications = data?.notifications ?? [];

  async function handleAction(notifId: string, actionId: string) {
    await gql(ResolveNotificationMutation, { id: notifId, actionId: actionId });
    refetch();
  }

  async function handleDismiss(notifId: string) {
    await gql(DismissNotificationMutation, { id: notifId });
    refetch();
  }

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (notifications.length === 0) {
    return <EmptyState message="No notifications yet" />;
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-3">
      {notifications.map((n) => (
        <NotificationCard
          key={n.id}
          notification={n}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      ))}
    </ScrollView>
  );
}
