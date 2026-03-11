import { X } from "lucide-react-native";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { useNavigationTheme } from "../lib/useNavigationTheme";

export function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useNavigationTheme();
  const { isDark } = useTheme();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={themeStyle}>
        <Pressable className="absolute inset-0 bg-overlay" onPress={onClose} />
        <View className="bg-surface rounded-t-2xl h-[95%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-app-border">
            <Text className="text-sm font-semibold text-text-primary">
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.iconDefault} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
