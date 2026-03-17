import { Stack } from "expo-router";
import { getStackScreenOptions } from "../../../src/lib/stackScreenOptions";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function JobsLayout() {
  const colors = useNavigationTheme();

  return (
    <Stack screenOptions={getStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: "Scheduled Jobs" }} />
      <Stack.Screen name="new" options={{ title: "New Job" }} />
      <Stack.Screen name="[id]" options={{ title: "Job" }} />
    </Stack>
  );
}
