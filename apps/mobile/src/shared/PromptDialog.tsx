import { vars } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { haptics } from "../lib/haptics";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { Button } from "./Button";

export function PromptDialog({
  visible,
  title,
  message,
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  validate,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue("");
      setError(null);
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    }
    haptics.medium();
    onConfirm(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={() => inputRef.current?.focus()}
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
          <Text className="text-text-muted text-sm mb-3">{message}</Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            onSubmitEditing={handleConfirm}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholderText}
            className="bg-bg border border-app-border rounded-lg px-3 py-2 text-sm text-text-primary mb-1"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {error && <Text className="text-xs text-red-500 mb-2">{error}</Text>}
          {!error && <View className="mb-2" />}
          <View className="flex-row justify-end gap-3">
            <Button onPress={onCancel} variant="ghost">
              {cancelLabel}
            </Button>
            <Button onPress={handleConfirm} variant="primary">
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
