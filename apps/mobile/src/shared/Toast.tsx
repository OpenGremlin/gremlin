import { AlertCircle, CircleCheck } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

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
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          delay: duration,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) onDismiss();
        });
      });
    } else {
      opacity.setValue(0);
    }
  }, [visible, duration, onDismiss, opacity]);

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
        pointerEvents: "none",
      }}
    >
      <Animated.View
        style={{ marginHorizontal: 24, opacity, pointerEvents: "none" }}
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
