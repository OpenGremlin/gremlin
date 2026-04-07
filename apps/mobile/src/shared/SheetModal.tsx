import { X } from "lucide-react-native";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { useNavigationTheme } from "../lib/useNavigationTheme";

const useNativeDriver = process.env.EXPO_OS !== "web";
const isIOS = process.env.EXPO_OS === "ios";

export function SheetModal({
  visible,
  title,
  onClose,
  headerActions,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Rendered to the left of the close button in the sheet header. */
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const colors = useNavigationTheme();
  const { isDark } = useTheme();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  // On iOS, defer to the native form sheet presentation. The OS handles
  // swipe-to-dismiss, the rounded squircle, and (on iOS 26+) the liquid
  // glass backdrop. We just render the content; no custom backdrop or
  // pan responder needed.
  if (isIOS) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={onClose}
        // transparent background lets iOS 26 liquid glass show through.
        transparent
      >
        <View className="flex-1 bg-surface" style={themeStyle}>
          <SheetHeader
            title={title}
            onClose={onClose}
            headerActions={headerActions}
            iconColor={colors.iconDefault}
          />
          <View className="flex-1 overflow-hidden">{children}</View>
        </View>
      </Modal>
    );
  }

  return (
    <WebSheet
      visible={visible}
      title={title}
      onClose={onClose}
      headerActions={headerActions}
      themeStyle={themeStyle}
      iconColor={colors.iconDefault}
    >
      {children}
    </WebSheet>
  );
}

function SheetHeader({
  title,
  onClose,
  headerActions,
  iconColor,
}: {
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  iconColor: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
      <Text
        className="text-sm font-semibold text-text-primary flex-1 mr-4"
        numberOfLines={1}
      >
        {title}
      </Text>
      <View className="flex-row items-center gap-2">
        {headerActions}
        <Pressable onPress={onClose} hitSlop={8}>
          <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
            <X size={16} color={iconColor} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// Web fallback: a simple slide-up sheet with a tap-outside backdrop.
// We don't ship the iOS pan-to-dismiss gesture on web; the close button
// is the primary affordance.
function WebSheet({
  visible,
  title,
  onClose,
  headerActions,
  themeStyle,
  iconColor,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  themeStyle: ReturnType<typeof vars>;
  iconColor: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = screenHeight - insets.top - 12;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 300,
          useNativeDriver,
        }),
      ]).start();
    } else {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim, screenHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={themeStyle}>
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute inset-0"
        >
          <Pressable className="flex-1 bg-overlay" onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            height: sheetHeight,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="flex-1 bg-surface rounded-t-2xl overflow-hidden">
            <SheetHeader
              title={title}
              onClose={onClose}
              headerActions={headerActions}
              iconColor={iconColor}
            />
            <View className="flex-1 overflow-hidden">{children}</View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
