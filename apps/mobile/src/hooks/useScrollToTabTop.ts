import { useNavigation } from "expo-router";
import { type RefObject, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Scrollable = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
};

export function useScrollToTabTop<T extends Scrollable>(
  ref: RefObject<T | null>,
) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    const unsubscribe = parent.addListener("tabPress" as never, () => {
      if (!navigation.isFocused()) return;
      requestAnimationFrame(() => {
        ref.current?.scrollToOffset({
          offset: -insets.top,
          animated: true,
        });
      });
    });
    return unsubscribe;
  }, [navigation, insets.top, ref]);
}
