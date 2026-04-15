import { Text, View } from "react-native";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
      <Text className="text-sm text-red-300">{message}</Text>
    </View>
  );
}
