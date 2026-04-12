import { useSafeAreaInsets } from "react-native-safe-area-context";

const isWeb = process.env.EXPO_OS === "web";

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return (isWeb ? 56 : 78) + (isWeb ? 0 : Math.max(insets.bottom - 14, 0));
}
