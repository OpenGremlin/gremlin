import { AlertCircle, CircleCheck } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type ToastVariant = "success" | "error";

const variantStyles: Record<
  ToastVariant,
  { bg: string; iconColor: string; textClass: string }
> = {
  success: {
    bg: "bg-emerald-900/90 border-emerald-700/50",
    iconColor: "#34d399",
    textClass: "text-emerald-200",
  },
  error: {
    bg: "bg-red-900/90 border-red-700/50",
    iconColor: "#fca5a5",
    textClass: "text-red-200",
  },
};

const variantIcons = { success: CircleCheck, error: AlertCircle };

export function Toast({
  message,
  visible,
  onDismiss,
  variant = "success",
  duration = 2500,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  variant?: ToastVariant;
  duration?: number;
}) {
  const v = variantStyles[variant];
  const Icon = variantIcons[variant];
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      // Auto-dismiss
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        }),
      );
    }
  }, [visible, duration, onDismiss, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[{ marginHorizontal: 24 }, animatedStyle]}
        pointerEvents="none"
      >
        <View
          className={`flex-row items-center gap-2.5 border rounded-xl px-4 py-3 ${v.bg}`}
        >
          <Icon size={18} color={v.iconColor} />
          <Text className={`text-sm font-medium flex-1 ${v.textClass}`}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
