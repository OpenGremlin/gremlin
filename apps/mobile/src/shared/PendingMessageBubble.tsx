import { ActivityIndicator, Text, View } from "react-native";

export function PendingMessageBubble({ content }: { content: string }) {
  return (
    <View className="flex-row justify-end py-1">
      <View className="max-w-[80%] flex-row items-start gap-2">
        <View className="bg-blue-600/40 border border-blue-500/20 rounded-2xl rounded-br-md px-3.5 py-2">
          <Text className="text-white/60 text-sm">{content}</Text>
        </View>
        <ActivityIndicator size="small" color="#60a5fa" className="mt-2.5" />
      </View>
    </View>
  );
}
