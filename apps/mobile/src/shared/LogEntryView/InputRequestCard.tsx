import { MessageCircleQuestion } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  DismissUserInputRequestMutation,
  ResolveUserInputRequestMutation,
} from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { useAllInputRequests } from "../../lib/PendingCountContext";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { ActionButton } from "../ActionButton";
import { ToolBlock } from "./ToolBlock";

export function InputRequestCard({
  inputRequestId,
  message,
  actions,
  createdAt,
  showTimestamp,
}: {
  inputRequestId: string;
  message: string;
  actions: Array<{ label: string; style: string }>;
  createdAt: string;
  showTimestamp: boolean;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const { allInputRequests, refetchInputRequests } = useAllInputRequests();
  const serverRequest = allInputRequests.find((r) => r.id === inputRequestId);
  const isPending = serverRequest?.status === "PENDING";
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (resolving) return;
    setResolving(action);
    try {
      await execute(ResolveUserInputRequestMutation, {
        id: inputRequestId,
        action,
      });
      setResolved(action);
      refetchInputRequests();
    } catch {
      setResolving(null);
    }
  };

  const handleDismiss = async () => {
    if (resolving) return;
    setResolving("__dismiss__");
    try {
      await execute(DismissUserInputRequestMutation, { id: inputRequestId });
      setResolved("__dismiss__");
      refetchInputRequests();
    } catch {
      setResolving(null);
    }
  };

  const label = (
    <View className="flex-row items-center gap-1">
      <MessageCircleQuestion size={12} color="#3b82f6" />
      <Text className="text-[11px] text-text-secondary font-bold font-mono">
        input request
      </Text>
    </View>
  );

  if (resolved || !isPending) {
    const chosenAction =
      resolved && resolved !== "__dismiss__"
        ? resolved
        : (serverRequest?.resolvedAction ?? null);
    const wasDismissed =
      resolved === "__dismiss__" || serverRequest?.status === "DISMISSED";

    return (
      <ToolBlock
        label={label}
        createdAt={createdAt}
        showTimestamp={showTimestamp}
      >
        <View className="px-3 py-2 gap-2">
          <Text className="text-sm text-text-secondary">{message}</Text>
          <View className="flex-row items-center gap-2 flex-wrap pt-1">
            {wasDismissed ? (
              <View className="rounded-lg py-1.5 px-3 bg-surface-alt">
                <Text className="text-xs text-text-muted italic">
                  Dismissed
                </Text>
              </View>
            ) : (
              actions.map((action) => {
                const isChosen = action.label === chosenAction;
                return (
                  <View
                    key={action.label}
                    className="rounded-lg py-1.5 px-3"
                    style={{
                      backgroundColor: isChosen
                        ? isDark
                          ? "#1e3a5f"
                          : "#dbeafe"
                        : isDark
                          ? "#262626"
                          : "#e5e5e5",
                      opacity: isChosen ? 1 : 0.35,
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: isChosen
                          ? isDark
                            ? "#93c5fd"
                            : "#1d4ed8"
                          : isDark
                            ? "#a3a3a3"
                            : "#525252",
                      }}
                    >
                      {action.label}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ToolBlock>
    );
  }

  return (
    <ToolBlock
      label={label}
      createdAt={createdAt}
      showTimestamp={showTimestamp}
    >
      <View className="px-3 py-2 gap-2">
        <Text className="text-sm text-text-secondary">{message}</Text>

        <View className="flex-row items-center gap-2 flex-wrap pt-1">
          {actions.map((action) => (
            <ActionButton
              key={action.label}
              onPress={() => handleAction(action.label)}
              label={action.label}
              variant={action.style === "primary" ? "primary" : "secondary"}
              disabled={!!resolving}
              loading={resolving === action.label}
            />
          ))}

          <Pressable
            onPress={handleDismiss}
            disabled={!!resolving}
            className="ml-1"
            style={{ opacity: resolving ? 0.5 : 1 }}
          >
            {resolving === "__dismiss__" ? (
              <ActivityIndicator size={14} color={colors.iconMuted} />
            ) : (
              <Text className="text-xs text-text-muted">Dismiss</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ToolBlock>
  );
}
