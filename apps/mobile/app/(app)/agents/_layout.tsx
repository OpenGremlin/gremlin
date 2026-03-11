import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AgentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#e5e5e5",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#0a0a0a" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Agents" }} />
      <Stack.Screen name="new" options={{ title: "New Agent" }} />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerBackTitle: "Agents",
          headerTransparent: true,
          headerBlurEffect: Platform.OS === "ios" ? "dark" : undefined,
          headerTitleAlign: "center",
          headerStyle: Platform.OS === "ios"
            ? { backgroundColor: "transparent" }
            : { backgroundColor: "#0a0a0a", height: 120 },
          title: "",
        }}
      />
      <Stack.Screen
        name="[id]/config"
        options={{ title: "Configure", headerBackTitle: "Chat" }}
      />
      <Stack.Screen
        name="[id]/tasks/[taskId]"
        options={{ title: "Task", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}
