import { Stack } from "expo-router";
import { getStackScreenOptions } from "../../../src/lib/stackScreenOptions";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function SettingsLayout() {
  const colors = useNavigationTheme();

  return (
    <Stack screenOptions={getStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="general" options={{ title: "General" }} />
      <Stack.Screen name="skills/index" options={{ title: "Skills" }} />
      <Stack.Screen
        name="skills/catalog/[templateId]"
        options={{ title: "Skill" }}
      />
      <Stack.Screen
        name="integrations/index"
        options={{ title: "Connections" }}
      />
      <Stack.Screen
        name="integrations/[id]"
        options={{ title: "Connection" }}
      />
      <Stack.Screen name="connections/[id]" options={{ title: "Connection" }} />
      <Stack.Screen name="files/index" options={{ title: "Files" }} />
      <Stack.Screen name="files/view" options={{ title: "File" }} />
    </Stack>
  );
}
