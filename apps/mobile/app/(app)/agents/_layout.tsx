import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useTheme } from "../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function AgentsLayout() {
  const colors = useNavigationTheme();
  const { isDark } = useTheme();

  // headerStyle on web accepts height but the native-stack type doesn't include it
  const chatHeaderStyle =
    Platform.OS === "ios"
      ? { backgroundColor: "transparent" }
      : ({ backgroundColor: "transparent", height: 120 } as {
          backgroundColor: string;
        });

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.headerText,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Agents" }} />
      <Stack.Screen name="new" options={{ title: "New Agent" }} />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerBackTitle: "Agents",
          headerTransparent: true,
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerTitleAlign: "center",
          headerStyle: chatHeaderStyle,
          title: "",
        }}
      />
      <Stack.Screen
        name="[id]/config"
        options={{ title: "Configure", headerBackTitle: "Chat" }}
      />
      <Stack.Screen
        name="[id]/tasks/[taskId]"
        options={{
          headerBackTitle: "Chat",
          headerTransparent: true,
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerTitleAlign: "center",
          headerStyle: chatHeaderStyle,
          title: "",
        }}
      />
    </Stack>
  );
}
