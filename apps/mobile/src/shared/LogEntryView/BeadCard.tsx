import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Circle, ExternalLink } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { BeadChild } from "../../hooks/useBeadInfo";
import { useBeadInfo } from "../../hooks/useBeadInfo";
import { useTheme } from "../../lib/ThemeContext";

function StatusIcon({ status, isDark }: { status: string; isDark: boolean }) {
  switch (status) {
    case "CLOSED":
      return <Check size={14} color={isDark ? "#86efac" : "#16a34a"} />;
    case "IN_PROGRESS":
      return (
        <Circle
          size={14}
          fill={isDark ? "#818cf8" : "#4f46e5"}
          color={isDark ? "#818cf8" : "#4f46e5"}
        />
      );
    default:
      // OPEN, BLOCKED
      return <Circle size={14} color={isDark ? "#6b7280" : "#9ca3af"} />;
  }
}

function ChildRow({
  child,
  agentId,
  isDark,
}: {
  child: BeadChild;
  agentId: string;
  isDark: boolean;
}) {
  const handlePress = () => {
    router.push(`/agents/${agentId}/beads/${child.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-start gap-2 py-1"
    >
      <View className="mt-0.5">
        <StatusIcon status={child.status} isDark={isDark} />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className={`text-sm ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
          numberOfLines={1}
        >
          {child.assigneeName ? `@${child.assigneeName} ` : ""}
          {child.title}
        </Text>
        {child.latestComment ? (
          <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
            {child.latestComment}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function BeadCard({
  beadId,
  agentId,
}: {
  beadId: string;
  agentId: string;
}) {
  const bead = useBeadInfo(beadId);
  const { isDark } = useTheme();

  const handlePress = () => {
    // Navigate to the task lane view — the bead ID is the task lane key,
    // so the task detail page shows the full work log (tool calls, etc.)
    router.push(`/agents/${agentId}/tasks/${beadId}`);
  };

  const gradientColors: [string, string, string] = isDark
    ? ["#080a1c", "#190837", "#280830"]
    : ["#eef2ff", "#e8e0f7", "#f0e8f5"];

  const hasChildren = bead && bead.children.length > 0;
  const closedCount =
    bead?.children.filter((c) => c.status === "CLOSED").length ?? 0;
  const totalCount = bead?.children.length ?? 0;

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={handlePress}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-indigo-500/20" : "border border-indigo-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-3 py-2.5">
            {/* Header row */}
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-sm font-medium flex-1 ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
                numberOfLines={1}
              >
                {bead?.title ?? "Loading..."}
              </Text>
              {hasChildren ? (
                <Text
                  className={`text-xs font-medium ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                >
                  {closedCount}/{totalCount}
                </Text>
              ) : (
                <ExternalLink
                  size={12}
                  color={isDark ? "#818cf8" : "#4f46e5"}
                />
              )}
            </View>

            {/* Simple task: assignee + subtitle */}
            {bead && !hasChildren && (
              <Text
                className={`text-xs mt-0.5 ${bead.latestComment || bead.assigneeName ? "text-text-muted" : "text-transparent"}`}
                numberOfLines={1}
              >
                {bead.assigneeName ? `@${bead.assigneeName}` : ""}
                {bead.assigneeName && bead.latestComment ? " \u00b7 " : ""}
                {bead.latestComment ?? ""}
              </Text>
            )}

            {/* Epic: child rows */}
            {bead && hasChildren && (
              <View className="mt-2">
                {bead.children.map((child) => (
                  <ChildRow
                    key={child.id}
                    child={child}
                    agentId={agentId}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
