import { Text, View } from "react-native";

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center py-12">
      <Text className="text-neutral-500 text-sm">{message}</Text>
    </View>
  );
}
