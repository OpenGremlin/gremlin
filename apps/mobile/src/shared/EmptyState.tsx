import { Text, View } from "react-native";

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center py-12">
      <Text className="text-text-muted text-sm">{message}</Text>
    </View>
  );
}
