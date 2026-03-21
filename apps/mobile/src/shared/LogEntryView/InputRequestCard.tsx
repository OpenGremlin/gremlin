import { MessageCircleQuestion } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  DismissUserInputRequestMutation,
  ResolveUserInputRequestMutation,
} from "../../graphql/queries";
import { gql } from "../../lib/auth";
import { usePendingCount } from "../../lib/PendingCountContext";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
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
  const { refetchInputRequests } = usePendingCount();
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (resolving) return;
    setResolving(action);
    try {
      await gql(ResolveUserInputRequestMutation, {
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
      await gql(DismissUserInputRequestMutation, { id: inputRequestId });
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

  if (resolved) {
    const resolvedLabel =
      resolved === "__dismiss__" ? "Dismissed" : `Responded: ${resolved}`;
    return (
      <ToolBlock
        label={label}
        createdAt={createdAt}
        showTimestamp={showTimestamp}
      >
        <View className="flex-row items-center gap-1.5 px-3 py-2">
          <MessageCircleQuestion size={13} color={colors.iconMuted} />
          <Text className="text-xs text-text-muted italic">
            {resolvedLabel}
          </Text>
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
          {actions.map((action) => {
            const isPrimary = action.style === "primary";
            return (
              <Pressable
                key={action.label}
                onPress={() => handleAction(action.label)}
                disabled={!!resolving}
                className="rounded-lg py-2 px-4 items-center"
                style={{
                  backgroundColor: isPrimary
                    ? isDark
                      ? "#4338ca"
                      : "#4f46e5"
                    : isDark
                      ? "#1a1a1a"
                      : "#f5f5f5",
                  borderWidth: isPrimary ? 0 : 1,
                  borderColor: isDark ? "#404040" : "#d4d4d4",
                  opacity: resolving ? 0.5 : 1,
                }}
              >
                {resolving === action.label ? (
                  <ActivityIndicator
                    size={14}
                    color={isPrimary ? "#ffffff" : colors.iconMuted}
                  />
                ) : (
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: isPrimary
                        ? isDark
                          ? "#e0e7ff"
                          : "#ffffff"
                        : isDark
                          ? "#a3a3a3"
                          : "#525252",
                    }}
                  >
                    {action.label}
                  </Text>
                )}
              </Pressable>
            );
          })}

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
