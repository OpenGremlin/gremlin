import type { GestureResponderEvent } from "react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

type ActionButtonVariant = "primary" | "secondary" | "destructive";

interface ActionButtonProps {
  onPress: (e: GestureResponderEvent) => void;
  label: string;
  variant?: ActionButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  expand?: boolean;
  pill?: boolean;
}

const variantClasses: Record<
  ActionButtonVariant,
  { base: string; text: string }
> = {
  primary: {
    base: "bg-accent",
    text: "text-white",
  },
  secondary: {
    base: "bg-surface-alt",
    text: "text-text-secondary",
  },
  destructive: {
    base: "bg-error-surface",
    text: "text-error",
  },
};

const indicatorColorForVariant: Record<
  ActionButtonVariant,
  "accent" | "error" | null
> = {
  primary: null,
  secondary: null,
  destructive: "error",
};

export function ActionButton({
  onPress,
  label,
  variant = "secondary",
  loading,
  disabled,
  expand,
  pill,
}: ActionButtonProps) {
  const colors = useNavigationTheme();
  const v = variantClasses[variant];
  const isDisabled = disabled || loading;
  const shape = pill ? "rounded-full" : "rounded-lg";

  const className = [
    "items-center justify-center px-3 py-1.5",
    shape,
    v.base,
    expand ? "flex-1" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const themeKey = indicatorColorForVariant[variant];
  const indicatorColor =
    variant === "primary" ? "#ffffff" : themeKey ? colors[themeKey] : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={className}
      style={{ opacity: isDisabled ? 0.5 : 1 }}
    >
      {loading ? (
        <ActivityIndicator size={12} color={indicatorColor} />
      ) : (
        <Text className={`text-xs font-medium ${v.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
