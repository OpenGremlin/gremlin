import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";

/**
 * Minimal one-line status display for tool calls.
 * High-contrast icon + muted italic text.
 *
 * Use `variant` to pick a semantic color from the theme,
 * or pass a raw `color` string for custom cases.
 */
export function ToolStatus({
  icon: Icon,
  text,
  color,
  variant,
}: {
  icon: LucideIcon;
  text: string;
  color?: string;
  variant?: "success" | "warning" | "error";
}) {
  const colors = useNavigationTheme();
  const iconColor = color ?? (variant ? colors[variant] : colors.iconDefault);
  return (
    <View className="flex-row items-center gap-1.5 py-1.5 px-1">
      <Icon size={13} color={iconColor} />
      <Text className="text-xs text-text-muted italic" numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}
