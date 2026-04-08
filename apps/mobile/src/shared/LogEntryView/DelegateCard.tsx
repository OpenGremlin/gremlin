import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ExternalLink, Send } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTaskInfo } from "../../hooks/useTaskInfo";
import { useTheme } from "../../lib/ThemeContext";
import { AgentAvatar } from "../AgentAvatar";

const AVATAR_SIZE = 56;
const CARD_RADIUS = 12;
// Border lives on the LinearGradient (not the outer Pressable) so the
// avatar's left corners can match the inside of the border exactly:
// inner curve = outer radius - border width = 12 - 1 = 11.
const CARD_INNER_RADIUS = CARD_RADIUS - 1;

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

  const borderColor = isDark ? "rgba(20, 184, 166, 0.2)" : "#5eead4";

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={taskId && targetAgentId ? handlePress : undefined}
        disabled={!taskId || !targetAgentId}
        className="rounded-xl overflow-hidden"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor,
          }}
        >
          <View
            className="flex-row items-stretch"
            style={{ minHeight: AVATAR_SIZE }}
          >
            {targetAgentId ? (
              <AgentAvatar
                id={targetAgentId}
                size={AVATAR_SIZE}
                cornerStyle={{
                  borderTopLeftRadius: CARD_INNER_RADIUS,
                  borderBottomLeftRadius: CARD_INNER_RADIUS,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              />
            ) : (
              <View
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderTopLeftRadius: CARD_INNER_RADIUS,
                  borderBottomLeftRadius: CARD_INNER_RADIUS,
                }}
                className="items-center justify-center bg-surface-alt"
              >
                <Send size={20} color={isDark ? "#5eead4" : "#0d9488"} />
              </View>
            )}
            <View className="flex-1 pl-3 pr-3 py-2.5 min-w-0 justify-center">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-medium flex-1 ${isDark ? "text-teal-100" : "text-teal-900"}`}
                  numberOfLines={1}
                >
                  {targetName ? `@${targetName}: ` : ""}
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
