import { ChevronDown } from "lucide-react-native";
import { View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

export function SelectWrapper({ children }: { children: React.ReactNode }) {
  const colors = useNavigationTheme();
  return (
    <View className="relative">
      {children}
      <View className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <ChevronDown size={14} color={colors.iconMuted} />
      </View>
    </View>
  );
}
