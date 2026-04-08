import { router } from "expo-router";
import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

/**
 * Layout primitive for the contents of a sheet route. Pair this with a
 * `Stack.Screen` configured as `presentation: 'formSheet'` (or
 * 'pageSheet') in the parent layout — the OS draws the chrome, the
 * swipe-down gesture, and the backdrop. This component owns the visual
 * header (title + optional actions + close button) and gives a stable
 * look across every sheet in the app.
 *
 * The X button calls router.back() so dismissal works the same whether
 * the user taps the button, swipes the sheet down, or uses the back
 * gesture. Pass `onClose` only if you need to run side effects before
 * the route pops.
 */
export function Sheet({
  title,
  headerActions,
  onClose,
  children,
}: {
  title: string;
  headerActions?: ReactNode;
  /** Optional cleanup hook called before the route pops. */
  onClose?: () => void;
  children: ReactNode;
}) {
  const colors = useNavigationTheme();

  const handleClose = () => {
    onClose?.();
    router.back();
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <Text
          className="text-sm font-semibold text-text-primary flex-1 mr-4"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="flex-row items-center gap-2">
          {headerActions}
          <Pressable onPress={handleClose} hitSlop={8}>
            <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
              <X size={16} color={colors.iconDefault} />
            </View>
          </Pressable>
        </View>
      </View>
      <View className="flex-1 overflow-hidden">{children}</View>
    </View>
  );
}
