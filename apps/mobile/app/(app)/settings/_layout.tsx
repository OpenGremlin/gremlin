import { Stack } from "expo-router";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function SettingsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen
        name="notifications"
        options={{ title: "Notifications", headerBackTitle: "Settings" }}
      />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="general" options={{ title: "General" }} />
      <Stack.Screen
        name="skills/index"
        options={{ title: "Skills", headerBackTitle: "Settings" }}
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
