import { ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { CommandApprovalDecision } from "../../graphql/generated/graphql";
import { ResolveCommandApprovalMutation } from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { useAllApprovals } from "../../lib/PendingCountContext";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { ActionButton } from "../ActionButton";
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
          <ActionButton
            onPress={() => handleResolve(CommandApprovalDecision.AllowOnce)}
            label="Allow Once"
            disabled={!!resolving}
            loading={resolving === CommandApprovalDecision.AllowOnce}
            expand
          />
          <ActionButton
            onPress={() => handleResolve(CommandApprovalDecision.AllowAlways)}
            label="Allow Always"
            variant="primary"
            disabled={!!resolving}
            loading={resolving === CommandApprovalDecision.AllowAlways}
            expand
          />
          <ActionButton
            onPress={() => handleResolve(CommandApprovalDecision.Deny)}
            label="Deny"
            variant="destructive"
            disabled={!!resolving}
            loading={resolving === CommandApprovalDecision.Deny}
            expand
          />
        </View>
      </View>
    </ToolBlock>
  );
}
