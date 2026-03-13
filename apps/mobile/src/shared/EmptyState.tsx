import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "./Button";

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
        <View className="mt-4">
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      )}
    </View>
  );
}
