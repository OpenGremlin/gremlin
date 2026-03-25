import { WifiOff } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function NetworkBanner() {
  const { isConnected } = useNetworkStatus();
  const translateY = useSharedValue(-60);

  useEffect(() => {
    translateY.value = withTiming(isConnected ? -60 : 0, { duration: 250 });
  }, [isConnected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 99,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View className="flex-row items-center justify-center gap-2 bg-red-900/90 px-4 py-2">
        <WifiOff size={14} color="#fca5a5" />
        <Text className="text-xs font-medium text-red-200">
          Unable to reach server
        </Text>
      </View>
    </Animated.View>
  );
}
