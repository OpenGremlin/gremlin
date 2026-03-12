import type { ViewStyle } from "react-native";
import { ActivityIndicator, Platform, Pressable, Text } from "react-native";

interface SaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
}

export function SaveButton({
  onPress,
  disabled,
  saving,
  label = "Save",
}: SaveButtonProps) {
  const isDisabled = disabled || saving;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`self-start px-4 py-2.5 rounded-lg border ${
        isDisabled
          ? "bg-surface-alt border-app-border"
          : "bg-accent border-accent hover:bg-accent-light active:bg-accent"
      }`}
      style={
        Platform.OS === "web"
          ? ({
              cursor: isDisabled ? "default" : "pointer",
            } as unknown as ViewStyle)
          : undefined
      }
    >
      {saving ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text
          className={`text-sm font-medium ${
            isDisabled ? "text-text-muted" : "text-white"
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
