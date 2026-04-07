import { X } from "lucide-react-native";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/ThemeContext";
import { darkVars, lightVars } from "../lib/themeVars";
import { useNavigationTheme } from "../lib/useNavigationTheme";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DISMISS_THRESHOLD = 120;
const useNativeDriver = Platform.OS !== "web";

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
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  const sheetHeight = SCREEN_HEIGHT - insets.top - 12;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          dragOffset.setValue(gesture.dy);
          fadeAnim.setValue(1 - gesture.dy / (SCREEN_HEIGHT * 0.5));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD || gesture.vy > 0.5) {
          animateClose();
        } else {
          Animated.parallel([
            Animated.spring(dragOffset, {
              toValue: 0,
              damping: 25,
              stiffness: 300,
              useNativeDriver,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      dragOffset.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      dragOffset.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim, dragOffset]);

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver,
      }),
    ]).start(() => {
      dragOffset.setValue(0);
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
    >
      <View className="flex-1 justify-end" style={themeStyle}>
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute inset-0"
        >
          <Pressable className="flex-1 bg-overlay" onPress={animateClose} />
        </Animated.View>

        <Animated.View
          style={{
            height: sheetHeight,
            transform: [{ translateY: Animated.add(slideAnim, dragOffset) }],
          }}
        >
          <View className="flex-1 bg-surface rounded-t-2xl overflow-hidden">
            <View
              {...panResponder.panHandlers}
              className="items-center pt-2.5 pb-1"
            >
              <View className="w-9 h-1 rounded-full bg-text-faint" />
            </View>

            <View
              className="flex-row items-center justify-between px-4 pt-2 pb-4"
              {...panResponder.panHandlers}
            >
              <Text
                className="text-sm font-semibold text-text-primary flex-1 mr-4"
                numberOfLines={1}
              >
                {title}
              </Text>
              <View className="flex-row items-center gap-2">
                {headerActions}
                <Pressable onPress={animateClose} hitSlop={8}>
                  <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
                    <X size={16} color={colors.iconDefault} />
                  </View>
                </Pressable>
              </View>
            </View>
            <View className="flex-1 overflow-hidden">{children}</View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
