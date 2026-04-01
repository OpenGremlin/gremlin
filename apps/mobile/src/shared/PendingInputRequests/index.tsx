import { router } from "expo-router";
import { MessageCircleQuestion } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { UserInputRequestsQuery as UserInputRequestsQueryType } from "../../graphql/generated/graphql";
import {
  DismissUserInputRequestMutation,
  ResolveUserInputRequestMutation,
} from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { AgentAvatar } from "../AgentAvatar";
import { timeAgo } from "../formatDate";

type UserInputRequest = UserInputRequestsQueryType["userInputRequests"][number];

function InputRequestCard({
  request,
  onResolved,
}: {
  request: UserInputRequest;
  onResolved: () => void;
}) {
  const handleAction = async (action: string) => {
    await execute(ResolveUserInputRequestMutation, { id: request.id, action });
    onResolved();
  };

  const handleDismiss = async () => {
    await execute(DismissUserInputRequestMutation, { id: request.id });
    onResolved();
  };

  return (
    <Pressable
      onPress={() => router.push(`/agents/${request.agent.id}`)}
      className="bg-surface border border-app-border rounded-xl p-4"
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

          <View className="flex-row items-center gap-2 flex-wrap">
            {request.actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAction(action.label);
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
                handleDismiss();
              }}
              className="ml-1"
            >
              <Text className="text-xs text-text-muted">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PendingInputRequests({
  requests,
  onResolved,
}: {
  requests: UserInputRequest[];
  onResolved: () => void;
}) {
  if (requests.length === 0) return null;

  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <View className="flex-row items-center gap-2">
        <MessageCircleQuestion size={14} color="#3b82f6" />
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Waiting for Input
        </Text>
        <View className="bg-blue-500/20 rounded-full px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-blue-500">
            {requests.length}
          </Text>
        </View>
      </View>
      {requests.map((r) => (
        <InputRequestCard key={r.id} request={r} onResolved={onResolved} />
      ))}
    </View>
  );
}
