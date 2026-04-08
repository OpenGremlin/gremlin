import { Stack } from "expo-router";
import { getStackScreenOptions } from "../../../src/lib/stackScreenOptions";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function AgentsLayout() {
  const colors = useNavigationTheme();

  // Chat screens use their own custom header (hidden on iOS, transparent on web)
  const chatHeaderStyle =
    process.env.EXPO_OS === "ios"
      ? { backgroundColor: "transparent" }
      : ({ backgroundColor: "transparent", height: 120 } as {
          backgroundColor: string;
        });

  return (
    <Stack screenOptions={getStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: "Agents" }} />
      <Stack.Screen name="new" options={{ title: "New Agent" }} />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerTitleAlign: "center",
          headerStyle: chatHeaderStyle,
          headerShown: process.env.EXPO_OS !== "ios",
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
          headerShown: process.env.EXPO_OS !== "ios",
          headerBackVisible: false,
          title: "",
        }}
      />
    </Stack>
  );
}
