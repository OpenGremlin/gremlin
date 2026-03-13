import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  /** full-width button (default for lg, false for others) */
  fullWidth?: boolean;
}

const variantClasses: Record<
  ButtonVariant,
  { base: string; text: string }
> = {
  primary: {
    base: "bg-accent border border-accent active:bg-accent-light",
    text: "text-white",
  },
  secondary: {
    base: "bg-accent-surface border border-accent-border active:bg-accent-surface/80",
    text: "text-accent",
  },
  destructive: {
    base: "bg-red-600 active:bg-red-700",
    text: "text-white",
  },
  ghost: {
    base: "active:bg-surface-alt",
    text: "text-text-muted",
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "px-3 py-1.5 rounded-lg", text: "text-sm" },
  md: { container: "px-4 py-2.5 rounded-lg", text: "text-sm" },
  lg: { container: "py-3 rounded-xl", text: "text-base" },
};

const DISABLED_OPACITY = 0.4;
const ANIMATION_MS = 200;

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  loadingText,
  icon,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variantClasses[variant];
  const s = sizeClasses[size];
  const shouldBeFullWidth = fullWidth ?? size === "lg";

  const opacity = useRef(
    new Animated.Value(isDisabled ? DISABLED_OPACITY : 1),
  ).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isDisabled ? DISABLED_OPACITY : 1,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [isDisabled, opacity]);

  const containerClass = [
    "flex-row items-center justify-center gap-2",
    s.container,
    v.base,
    shouldBeFullWidth ? "" : "self-start",
  ]
    .filter(Boolean)
    .join(" ");

  const textClass = [s.text, "font-medium", v.text].join(" ");

  const indicatorColor = variant === "ghost" ? undefined : "white";
  const label = loading && loadingText ? loadingText : children;

  return (
    <Animated.View
      style={[
        { opacity },
        Platform.OS === "web"
          ? ({ cursor: isDisabled ? "default" : "pointer" } as unknown as ViewStyle)
          : undefined,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={containerClass}
      >
        {loading ? (
          <ActivityIndicator color={indicatorColor} size="small" />
        ) : icon ? (
          <View>{icon}</View>
        ) : null}
        <Text className={textClass}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
