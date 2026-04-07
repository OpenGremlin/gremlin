import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

export function DelayedSpinner() {
  const colors = useNavigationTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: process.env.EXPO_OS !== "web",
      }).start();
    }, 100);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <ActivityIndicator size="large" color={colors.accentIndicator} />
    </Animated.View>
  );
}
