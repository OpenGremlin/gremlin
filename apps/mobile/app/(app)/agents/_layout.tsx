import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function AgentsLayout() {
  const colors = useNavigationTheme();

  // Chat screens use their own custom header (hidden on iOS, transparent on web)
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
          headerTransparent: true,
          headerTitleAlign: "center",
          headerStyle: chatHeaderStyle,
          headerShown: Platform.OS !== "ios",
          headerBackVisible: false,
          title: "",
        }}
      />
      <Stack.Screen name="[id]/config" options={{ title: "Configure Agent" }} />
      <Stack.Screen
        name="[id]/canvas"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="[id]/tasks/[taskId]"
        options={{
          headerTransparent: true,
          headerTitleAlign: "center",
          headerStyle: chatHeaderStyle,
          headerShown: Platform.OS !== "ios",
          headerBackVisible: false,
          title: "",
        }}
      />
    </Stack>
  );
}
