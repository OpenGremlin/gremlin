import { Stack } from "expo-router";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function JobsLayout() {
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
      <Stack.Screen
        name="index"
        options={{ title: "Scheduled Jobs" }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "New Job" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Job" }}
      />
    </Stack>
  );
}
