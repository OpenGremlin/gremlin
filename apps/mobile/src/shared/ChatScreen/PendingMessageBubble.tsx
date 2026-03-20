import { ActivityIndicator, Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";

export function PendingMessageBubble({ content }: { content: string }) {
  const colors = useNavigationTheme();
  return (
    <View className="flex-row justify-end py-1">
      <View className="max-w-[80%] flex-row items-start gap-2">
        <View className="bg-user-bubble/40 border border-accent-border rounded-2xl rounded-br-md px-3.5 py-2">
          <Text className="text-text-muted text-sm">{content}</Text>
        </View>
        <ActivityIndicator
          size="small"
          color={colors.accentLight}
          className="mt-2.5"
        />
      </View>
    </View>
  );
}
