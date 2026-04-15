import { ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CommandApprovalDecision } from "../../graphql/generated/graphql";
import { ResolveCommandApprovalMutation } from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { useAllApprovals } from "../../lib/PendingCountContext";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { FnLabel } from "./FnLabel";
import { ToolBlock } from "./ToolBlock";

export function CommandApprovalCard({
  commandApprovalId,
  command,
  reason,
  createdAt,
  showTimestamp,
}: {
  commandApprovalId: string;
  command: string;
  reason: string;
  createdAt: string;
  showTimestamp: boolean;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const { allApprovals, refetchApprovals } = useAllApprovals();
  const serverApproval = allApprovals.find((a) => a.id === commandApprovalId);
  const isPending = serverApproval?.status === "PENDING";
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const handleResolve = async (decision: CommandApprovalDecision) => {
    if (resolving) return;
    setResolving(decision);
    try {
      await execute(ResolveCommandApprovalMutation, {
        id: commandApprovalId,
        decision,
      });
      setResolved(true);
      refetchApprovals();
    } catch {
      setResolving(null);
    }
  };

  const fnLabel = <FnLabel fn="run" arg={command} />;

  if (resolved || !isPending) {
    const decision = resolving ?? serverApproval?.decision ?? null;
    const wasDenied = decision === CommandApprovalDecision.Deny;
    const decisionLabel = wasDenied
      ? "Denied"
      : decision === CommandApprovalDecision.AllowAlways
        ? "Allowed Always"
        : "Allowed Once";

    return (
      <ToolBlock
        label={fnLabel}
        createdAt={createdAt}
        showTimestamp={showTimestamp}
      >
        <View className="px-3 py-2 gap-2">
          {reason ? (
            <Text className="text-xs text-text-secondary">{reason}</Text>
          ) : null}

          <View
            className="rounded-lg px-3 py-2"
            style={{
              backgroundColor: isDark ? "#1a1a1a" : "#e4e4e4",
            }}
          >
            <Text
              className="text-xs font-mono"
              style={{ color: isDark ? "#e5e5e5" : "#171717" }}
              numberOfLines={3}
            >
              {command}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <ShieldAlert
              size={13}
              color={wasDenied ? colors.error : "#22c55e"}
            />
            <Text
              className="text-xs font-medium"
              style={{
                color: wasDenied
                  ? colors.error
                  : isDark
                    ? "#86efac"
                    : "#16a34a",
              }}
            >
              {decisionLabel}
            </Text>
          </View>
        </View>
      </ToolBlock>
    );
  }

  return (
    <ToolBlock
      label={fnLabel}
      createdAt={createdAt}
      showTimestamp={showTimestamp}
    >
      <View className="px-3 py-2 gap-2">
        {reason ? (
          <Text className="text-xs text-text-secondary">{reason}</Text>
        ) : null}

        <View
          className="rounded-lg px-3 py-2"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#e4e4e4",
          }}
        >
          <Text
            className="text-xs font-mono"
            style={{ color: isDark ? "#e5e5e5" : "#171717" }}
            numberOfLines={3}
          >
            {command}
          </Text>
        </View>

        <View className="flex-row gap-2 pt-1">
          <Pressable
            onPress={() => handleResolve(CommandApprovalDecision.AllowOnce)}
            disabled={!!resolving}
            className="flex-1 rounded-lg py-2 items-center"
            style={{
              backgroundColor: isDark ? "#262626" : "#e5e5e5",
              opacity: resolving ? 0.5 : 1,
            }}
          >
            {resolving === CommandApprovalDecision.AllowOnce ? (
              <ActivityIndicator size={14} color={colors.iconMuted} />
            ) : (
              <Text className="text-xs font-medium text-text-secondary">
                Allow Once
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleResolve(CommandApprovalDecision.AllowAlways)}
            disabled={!!resolving}
            className="flex-1 rounded-lg py-2 items-center"
            style={{
              backgroundColor: resolving
                ? isDark
                  ? "#3730a3"
                  : "#c7d2fe"
                : isDark
                  ? "#4338ca"
                  : "#4f46e5",
              opacity: resolving ? 0.5 : 1,
            }}
          >
            {resolving === CommandApprovalDecision.AllowAlways ? (
              <ActivityIndicator size={14} color="#ffffff" />
            ) : (
              <Text
                className="text-xs font-medium"
                style={{ color: isDark ? "#e0e7ff" : "#ffffff" }}
              >
                Allow Always
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleResolve(CommandApprovalDecision.Deny)}
            disabled={!!resolving}
            className="flex-1 rounded-lg py-2 items-center"
            style={{
              backgroundColor: isDark ? "#2a1515" : "#fee2e2",
              opacity: resolving ? 0.5 : 1,
            }}
          >
            {resolving === CommandApprovalDecision.Deny ? (
              <ActivityIndicator size={14} color={colors.error} />
            ) : (
              <Text
                className="text-xs font-medium"
                style={{ color: colors.error }}
              >
                Deny
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ToolBlock>
  );
}
