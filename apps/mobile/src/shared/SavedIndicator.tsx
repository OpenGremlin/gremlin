import { Check } from "lucide-react-native";
import { Text, View } from "react-native";

export function SavedIndicator() {
  return (
    <View className="flex-row items-center gap-1">
      <Check size={14} color="#4ade80" />
      <Text className="text-xs text-green-400">Saved</Text>
    </View>
  );
}
