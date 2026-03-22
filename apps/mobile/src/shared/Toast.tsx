import { CircleCheck } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Toast({
  message,
  visible,
  onDismiss,
  duration = 2500,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      // Auto-dismiss
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        }),
      );
      translateY.value = withDelay(
        duration,
        withTiming(-20, { duration: 300 }),
      );
    }
  }, [visible, duration, onDismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          zIndex: 100,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View className="flex-row items-center gap-2.5 bg-emerald-900/90 border border-emerald-700/50 rounded-xl px-4 py-3">
        <CircleCheck size={18} color="#34d399" />
        <Text className="text-sm font-medium text-emerald-200 flex-1">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
