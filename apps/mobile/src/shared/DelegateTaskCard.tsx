import { router } from "expo-router";
import { Check, ExternalLink } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { useTaskInfo } from "../hooks/useTaskInfo";
import { DocumentCard } from "./DocumentCard";

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
  const docs = task?.documents ?? [];
  const imageUrl = task?.imageUrl;

  const handlePress = () => {
    if (taskId) {
      router.push(`/agents/${agentId}/tasks/${taskId}`);
    }
  };

  const messages = task?.messages ?? [];
  const reversed = [...messages].reverse();

  return (
    <View className="py-1">
      <Pressable
        onPress={taskId ? handlePress : undefined}
        disabled={!taskId}
        className="border border-indigo-500/20 rounded-xl overflow-hidden bg-neutral-900"
        style={{
          backgroundColor: "#0a0a1e",
        }}
      >
        <View className="flex-row">
          <View className="flex-1 px-3.5 pt-3 pb-3">
            <View className="flex-row items-start">
              <Text className="text-sm text-indigo-100 font-medium flex-1 leading-5">
                <Text className="font-bold">Task:</Text> {taskTitle}
              </Text>
              {taskId && (
                <View className="ml-2 mt-0.5">
                  <ExternalLink size={12} color="#818cf8" />
                </View>
              )}
            </View>

            {/* Progress messages */}
            <View className="mt-2 gap-1.5">
              {reversed.length > 0 ? (
                reversed.map((msg, i) => {
                  const opacity = i === 0 ? 1 : Math.max(0.25, 1 - i * 0.35);
                  return (
                    <View
                      key={msg}
                      className="flex-row items-start gap-1.5"
                      style={{ opacity }}
                    >
                      <View className="mt-[3px] opacity-40">
                        <Check size={10} color="#a3a3a3" />
                      </View>
                      <Text className="text-xs text-neutral-400 flex-1">
                        {msg}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-xs text-neutral-500">Delegated task</Text>
              )}
            </View>
          </View>

          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              className="w-[90px] h-[90px] rounded-lg m-3 ml-0"
              resizeMode="cover"
            />
          )}
        </View>

        {/* Documents */}
        {docs.length > 0 && (
          <View className="px-3.5 pb-3 gap-1.5">
            {docs.map((doc) => (
              <DocumentCard key={doc.path} doc={doc} />
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}
