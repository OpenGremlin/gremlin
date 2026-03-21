import { Text, View } from "react-native";

export function PendingMessageBubble({ content }: { content: string }) {
  return (
    <View className="flex-row justify-end py-1">
      <View className="max-w-[80%]">
        <View className="bg-user-bubble/40 border border-accent-border rounded-2xl rounded-br-md px-3.5 py-2">
          <Text className="text-text-muted text-sm">{content}</Text>
        </View>
      </View>
    </View>
  );
}
