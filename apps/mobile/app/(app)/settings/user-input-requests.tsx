import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { UserInputRequestsQuery as UserInputRequestsQueryType } from "../../../src/graphql/generated/graphql";
import {
  DismissUserInputRequestMutation,
  ResolveUserInputRequestMutation,
  UserInputRequestsQuery,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { EmptyState } from "../../../src/shared/EmptyState";
import { timeAgo } from "../../../src/shared/formatDate";
import { QueryResult } from "../../../src/shared/QueryResult";

type UserInputRequest = UserInputRequestsQueryType["userInputRequests"][number];

function UserInputRequestCard({
  request,
  onAction,
  onDismiss,
}: {
  request: UserInputRequest;
  onAction: (requestId: string, action: string) => void;
  onDismiss: (requestId: string) => void;
}) {
  const resolved = request.status !== "PENDING";
  const resolvedLabel = request.resolvedAction;

  return (
    <Pressable
      onPress={() => router.push(`/agents/${request.agent.id}`)}
      className={`bg-surface border border-app-border rounded-xl p-4 ${resolved ? "opacity-40" : ""}`}
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5">
          <AgentAvatar id={request.agent.id} size={36} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-text-primary">
              {request.agent.name}
            </Text>
            <Text className="text-[11px] text-text-muted shrink ml-2">
              {timeAgo(request.createdAt)}
            </Text>
          </View>
          <Text className="text-sm text-text-secondary mb-3">
            {request.message}
          </Text>

          {resolved ? (
            <Text className="text-xs text-text-muted">
              {request.status === "DISMISSED"
                ? "Dismissed"
                : (resolvedLabel ?? "Resolved")}
            </Text>
          ) : (
            <View className="flex-row items-center gap-2 flex-wrap">
              {request.actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={(e) => {
                    e.stopPropagation();
                    onAction(request.id, action.label);
                  }}
                  className={`rounded-full px-3 py-1 ${
                    action.style === "primary" ? "bg-accent" : "bg-surface-alt"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      action.style === "primary"
                        ? "text-white"
                        : "text-text-secondary"
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDismiss(request.id);
                }}
                className="ml-1"
              >
                <Text className="text-xs text-text-muted">Dismiss</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function UserInputRequestsScreen() {
  const { data, loading, error, refetch } = useQuery(UserInputRequestsQuery);

  const requests = data?.userInputRequests ?? [];

  async function handleAction(requestId: string, action: string) {
    await gql(ResolveUserInputRequestMutation, { id: requestId, action });
    refetch();
  }

  async function handleDismiss(requestId: string) {
    await gql(DismissUserInputRequestMutation, { id: requestId });
    refetch();
  }

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (requests.length === 0) {
    return <EmptyState message="No requests yet" />;
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-3">
      {requests.map((n) => (
        <UserInputRequestCard
          key={n.id}
          request={n}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      ))}
    </ScrollView>
  );
}
