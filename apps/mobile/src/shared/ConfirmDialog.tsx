import { vars } from "nativewind";
import { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { Button } from "./Button";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { isDark } = useTheme();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-overlay items-center justify-center px-8"
        style={themeStyle}
      >
        <Pressable
          onPress={() => {}}
          className="bg-surface border border-app-border rounded-2xl w-full max-w-sm px-6 py-5"
        >
          <Text className="text-text-primary font-semibold text-base mb-1">
            {title}
          </Text>
          <Text className="text-text-muted text-sm mb-5">{message}</Text>
          <View className="flex-row justify-end gap-3">
            <Button onPress={onCancel} variant="ghost">
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
            >
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
