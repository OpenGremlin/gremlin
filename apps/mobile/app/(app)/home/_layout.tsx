import { Stack } from "expo-router";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function HomeLayout() {
  const colors = useNavigationTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.headerText,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
