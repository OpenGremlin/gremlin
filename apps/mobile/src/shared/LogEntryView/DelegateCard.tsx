import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ExternalLink, Send } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTaskInfo } from "../../hooks/useTaskInfo";
import { useTheme } from "../../lib/ThemeContext";

/**
 * Inline card for a `delegate` tool call in the manager's main lane.
 * Mirrors BackgroundTaskCard structurally but renders the *target* agent
 * (not the manager) and links to the target's task lane viewer.
 */
export function DelegateCard({
  targetAgentId,
  targetName,
  taskId,
  taskTitle,
  brief,
  rejectedReason,
}: {
  targetAgentId: string | null;
  targetName: string | null;
  taskId: string | null;
  taskTitle: string;
  brief: string | null;
  rejectedReason: string | null;
}) {
  const task = useTaskInfo(taskId);
  const { isDark } = useTheme();
  const emoji = task?.emoji;
  const lastMessage = task?.lastMessage;

  const handlePress = () => {
    if (taskId && targetAgentId) {
      router.push(`/agents/${targetAgentId}/tasks/${taskId}`);
    }
  };

  // Rejected delegations (target not in team) get an error treatment.
  if (rejectedReason) {
    return (
      <View className="py-2 max-w-[85%]">
        <View
          className={`rounded-xl px-3 py-2 border ${isDark ? "border-error/40 bg-error/10" : "border-error/30 bg-error/5"}`}
        >
          <View className="flex-row items-center gap-1.5">
            <Send size={12} color="#ef4444" />
            <Text className="text-sm font-medium text-error flex-1">
              Delegation rejected
            </Text>
          </View>
          <Text className="text-xs text-text-muted mt-1">{rejectedReason}</Text>
        </View>
      </View>
    );
  }

  const gradientColors: [string, string, string] = isDark
    ? ["#041d1c", "#06302a", "#0a3a3a"]
    : ["#e6fffa", "#d2f5ee", "#c8eef0"];

  const subtitle = lastMessage
    ? lastMessage
    : brief
      ? brief
      : targetName
        ? `Delegated to @${targetName}`
        : "Delegated task";

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={taskId && targetAgentId ? handlePress : undefined}
        disabled={!taskId || !targetAgentId}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-teal-500/20" : "border border-teal-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="flex-row items-center">
            {emoji ? (
              <View className="ml-2 pr-1 items-center justify-center">
                <Text style={{ fontSize: 30, lineHeight: 36 }}>{emoji}</Text>
              </View>
            ) : (
              <View className="ml-3 pr-1 items-center justify-center">
                <Send size={20} color={isDark ? "#5eead4" : "#0d9488"} />
              </View>
            )}
            <View className="flex-1 pl-2 pr-3 py-2.5 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-medium flex-1 ${isDark ? "text-teal-100" : "text-teal-900"}`}
                  numberOfLines={1}
                >
                  {targetName ? `→ @${targetName}: ` : ""}
                  {taskTitle}
                </Text>
                {taskId && targetAgentId && (
                  <ExternalLink
                    size={12}
                    color={isDark ? "#5eead4" : "#0d9488"}
                  />
                )}
              </View>
              <Text
                className="text-xs mt-0.5 text-text-muted"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
