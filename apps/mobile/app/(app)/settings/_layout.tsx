import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#e5e5e5",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#0a0a0a" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="global" options={{ title: "Global" }} />
      <Stack.Screen
        name="skills/index"
        options={{ title: "Skills", headerBackTitle: "Settings" }}
      />
      <Stack.Screen
        name="skills/[id]"
        options={{ title: "Skill", headerBackTitle: "Skills" }}
      />
      <Stack.Screen
        name="skills/catalog/[templateId]"
        options={{ title: "Skill", headerBackTitle: "Skills" }}
      />
      <Stack.Screen
        name="integrations/index"
        options={{ title: "Integrations", headerBackTitle: "Settings" }}
      />
      <Stack.Screen
        name="integrations/[id]"
        options={{ title: "Integration", headerBackTitle: "Integrations" }}
      />
      <Stack.Screen
        name="connections/[id]"
        options={{ title: "Connection", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="files/index"
        options={{ title: "Files", headerBackTitle: "Settings" }}
      />
      <Stack.Screen
        name="files/view"
        options={{ title: "File", headerBackTitle: "Files" }}
      />
    </Stack>
  );
}
