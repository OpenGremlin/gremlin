import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTaskInfo } from "../../hooks/useTaskInfo";
import { useTheme } from "../../lib/ThemeContext";

export function BackgroundTaskCard({
  agentId,
  taskId,
  taskTitle,
}: {
  agentId: string;
  taskId: string | null;
  taskTitle: string;
}) {
  const task = useTaskInfo(taskId);
  const { isDark } = useTheme();
  const emoji = task?.emoji;
  const lastMessage = task?.lastMessage;

  const handlePress = () => {
    if (taskId) {
      router.push(`/agents/${agentId}/tasks/${taskId}`);
    }
  };

  const gradientColors: [string, string, string] = isDark
    ? ["#080a1c", "#190837", "#280830"]
    : ["#eef2ff", "#e8e0f7", "#f0e8f5"];

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={taskId ? handlePress : undefined}
        disabled={!taskId}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-indigo-500/20" : "border border-indigo-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="flex-row items-center">
            {emoji && (
              <View className="w-9 ml-2 items-center justify-center">
                <Text style={{ fontSize: 30, lineHeight: 36 }}>{emoji}</Text>
              </View>
            )}
            <View className="flex-1 pl-2 pr-3 py-2.5 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-medium flex-1 ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
                  numberOfLines={1}
                >
                  {taskTitle}
                </Text>
                {taskId && (
                  <ExternalLink
                    size={12}
                    color={isDark ? "#818cf8" : "#4f46e5"}
                  />
                )}
              </View>
              <Text
                className={`text-xs mt-0.5 ${lastMessage ? "text-text-muted" : "text-transparent"}`}
                numberOfLines={1}
              >
                {lastMessage || "Delegated task"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
