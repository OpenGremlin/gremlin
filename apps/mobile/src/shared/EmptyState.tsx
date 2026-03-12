import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

interface EmptyStateProps {
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  message,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const colors = useNavigationTheme();
  return (
    <View className="items-center py-16 px-8">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-text-secondary text-base font-medium text-center">
        {message}
      </Text>
      {description && (
        <Text className="text-text-muted text-sm text-center mt-1.5 max-w-[260px]">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 bg-accent rounded-lg px-5 py-2.5"
        >
          <Text className="text-white text-sm font-medium">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
