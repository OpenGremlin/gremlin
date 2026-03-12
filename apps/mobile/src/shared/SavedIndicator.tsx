import { Check } from "lucide-react-native";
import { Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

export function SavedIndicator() {
  const colors = useNavigationTheme();
  return (
    <View className="flex-row items-center gap-1">
      <Check size={14} color={colors.success} />
      <Text className="text-xs text-success">Saved</Text>
    </View>
  );
}
