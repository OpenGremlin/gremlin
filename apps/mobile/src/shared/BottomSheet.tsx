import { X } from "lucide-react-native";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { useNavigationTheme } from "../lib/useNavigationTheme";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.85;

/**
 * A bottom-sheet-style modal that visually matches the native formSheet
 * presentation. Uses RN Modal with slide animation, a dimmed backdrop,
 * rounded top corners, and a grabber handle.
 */
export function BottomSheet({
  visible,
  title,
  headerActions,
  onDismiss,
  children,
}: {
  visible: boolean;
  title: string;
  headerActions?: ReactNode;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[{ flex: 1, justifyContent: "flex-end" }, themeStyle]}>
        {/* Dimmed backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={onDismiss}
        />
        {/* Sheet */}
        <View
          style={{
            height: SHEET_HEIGHT,
            backgroundColor: colors.headerBackground,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            overflow: "hidden",
            paddingBottom: insets.bottom,
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignItems: "center",
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.15)",
              }}
            />
          </View>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 12,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.headerText,
                flex: 1,
                marginRight: 16,
              }}
            >
              {title}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {headerActions}
              <Pressable onPress={onDismiss} hitSlop={8}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} color={colors.iconDefault} />
                </View>
              </Pressable>
            </View>
          </View>
          {/* Body */}
          <View style={{ flex: 1, overflow: "hidden" }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}
