import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  CommandApprovalDecision,
  type PendingCommandApprovalsQuery as PendingCommandApprovalsQueryType,
} from "../../graphql/generated/graphql";
import { ResolveCommandApprovalMutation } from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { AgentAvatar } from "../AgentAvatar";
import { timeAgo } from "../formatDate";

type Approval =
  PendingCommandApprovalsQueryType["pendingCommandApprovals"][number];

const ApprovalCard = React.memo(function ApprovalCard({
  approval,
  onResolved,
}: {
  approval: Approval;
  onResolved: () => void;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (decision: CommandApprovalDecision) => {
    if (resolving) return;
    setResolving(decision);
    try {
      await execute(ResolveCommandApprovalMutation, {
        id: approval.id,
        decision,
      });
      onResolved();
    } catch {
      setResolving(null);
    }
  };

  return (
    <Pressable
      onPress={() =>
        router.push(`/tasks/${approval.taskId}`)
      }
      className="bg-surface border border-app-border rounded-xl p-4"
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5">
          <AgentAvatar id={approval.agent.id} size={36} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-text-primary">
              {approval.agent.name}
            </Text>
            <Text className="text-[11px] text-text-muted shrink ml-2">
              {timeAgo(approval.createdAt)}
            </Text>
          </View>

          {approval.reason ? (
            <Text className="text-sm text-text-secondary mb-2">
              {approval.reason}
            </Text>
          ) : null}

          <View
            className="rounded-lg px-3 py-2 mb-3"
            style={{ backgroundColor: isDark ? "#1a1a1a" : "#e4e4e4" }}
          >
            <Text
              className="text-xs font-mono"
              style={{ color: isDark ? "#e5e5e5" : "#171717" }}
              numberOfLines={2}
            >
              {approval.command}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleResolve(CommandApprovalDecision.AllowOnce);
              }}
              disabled={!!resolving}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: isDark ? "#262626" : "#e5e5e5",
                opacity: resolving ? 0.5 : 1,
              }}
            >
              {resolving === CommandApprovalDecision.AllowOnce ? (
                <ActivityIndicator size={12} color={colors.iconMuted} />
              ) : (
                <Text className="text-xs font-medium text-text-secondary">
                  Allow Once
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleResolve(CommandApprovalDecision.AllowAlways);
              }}
              disabled={!!resolving}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: isDark ? "#4338ca" : "#4f46e5",
                opacity: resolving ? 0.5 : 1,
              }}
            >
              {resolving === CommandApprovalDecision.AllowAlways ? (
                <ActivityIndicator size={12} color="#ffffff" />
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
              onPress={(e) => {
                e.stopPropagation();
                handleResolve(CommandApprovalDecision.Deny);
              }}
              disabled={!!resolving}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: isDark ? "#2a1515" : "#fee2e2",
                opacity: resolving ? 0.5 : 1,
              }}
            >
              {resolving === CommandApprovalDecision.Deny ? (
                <ActivityIndicator size={12} color={colors.error} />
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
      </View>
    </Pressable>
  );
});

export function PendingApprovals({
  approvals,
  onResolved,
}: {
  approvals: Approval[];
  onResolved: () => void;
}) {
  if (approvals.length === 0) return null;

  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <View className="flex-row items-center gap-2">
        <ShieldAlert size={14} color="#f59e0b" />
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Pending Approvals
        </Text>
        <View className="bg-warning/20 rounded-full px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-warning">
            {approvals.length}
          </Text>
        </View>
      </View>
      {approvals.map((a) => (
        <ApprovalCard key={a.id} approval={a} onResolved={onResolved} />
      ))}
    </View>
  );
}
