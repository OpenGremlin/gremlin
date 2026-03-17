import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Platform, Pressable } from "react-native";

type Colors = {
  headerBackground: string;
  headerText: string;
  background: string;
};

export function getStackScreenOptions(colors: Colors) {
  const base: Record<string, unknown> = {
    headerStyle: { backgroundColor: colors.headerBackground },
    headerTintColor: colors.headerText,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };

  if (Platform.OS === "web") {
    base.headerBackVisible = false;
    base.headerLeft = () =>
      router.canGoBack() ? (
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft size={24} color={colors.headerText} />
        </Pressable>
      ) : null;
  }

  return base;
}
