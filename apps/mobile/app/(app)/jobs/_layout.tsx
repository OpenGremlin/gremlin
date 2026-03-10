import { Stack } from "expo-router";

export default function JobsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#e5e5e5",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#0a0a0a" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Jobs" }} />
      <Stack.Screen name="new" options={{ title: "New Job" }} />
      <Stack.Screen
        name="[id]"
        options={{ title: "Job", headerBackTitle: "Jobs" }}
      />
    </Stack>
  );
}
