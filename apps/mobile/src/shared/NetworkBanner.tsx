import { WifiOff } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { type BannerState, deriveBannerState } from "./networkBannerState";

const BACK_ONLINE_DURATION = 2000;

export function NetworkBanner() {
  const { isConnected } = useNetworkStatus();
  const [banner, setBanner] = useState<BannerState>("hidden");
  const prevConnected = useRef(true);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    if (isConnected === prevConnected.current) return;
    prevConnected.current = isConnected;
    setBanner((prev) => deriveBannerState(isConnected, prev));
  }, [isConnected]);

  useEffect(() => {
    if (banner === "back-online") {
      const timer = setTimeout(() => setBanner("hidden"), BACK_ONLINE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  const visible = banner !== "hidden";

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : -60, { duration: 250 });
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const isOffline = banner === "offline";

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
      <View
        className={`flex-row items-center justify-center gap-2 px-4 py-2 ${isOffline ? "bg-red-900/90" : "bg-emerald-900/90"}`}
      >
        {isOffline && <WifiOff size={14} color="#fca5a5" />}
        <Text
          className={`text-xs font-medium ${isOffline ? "text-red-200" : "text-emerald-200"}`}
        >
          {isOffline ? "No internet connection" : "Back online"}
        </Text>
      </View>
    </Animated.View>
  );
}
