import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { useTaskInfo } from "../../hooks/useTaskInfo";

export function DelegateTaskCard({
  agentId,
  taskId,
  taskTitle,
}: {
  agentId: string;
  taskId: string | null;
  taskTitle: string;
}) {
  const task = useTaskInfo(taskId);
  const imageUrl = task?.imageUrl;
  const lastMessage = task?.lastMessage;

  const handlePress = () => {
    if (taskId) {
      router.push(`/agents/${agentId}/tasks/${taskId}`);
    }
  };

  return (
    <View className="py-2 mr-10">
      <Pressable
        onPress={taskId ? handlePress : undefined}
        disabled={!taskId}
        className="border border-indigo-500/20 rounded-xl overflow-hidden"
      >
        <LinearGradient
          colors={["#080a1c", "#190837", "#280830"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="flex-row items-center">
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                className="w-10 h-10 rounded-lg ml-3"
                resizeMode="cover"
              />
            )}
            <View className="flex-1 px-3 py-2.5 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="text-sm text-indigo-100 font-medium flex-1"
                  numberOfLines={1}
                >
                  {taskTitle}
                </Text>
                {taskId && <ExternalLink size={12} color="#818cf8" />}
              </View>
              <Text
                className={`text-xs mt-0.5 ${lastMessage ? "text-neutral-400" : "text-transparent"}`}
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
