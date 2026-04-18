import { Stack } from "expo-router";
import { getStackScreenOptions } from "../../../src/lib/stackScreenOptions";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function CanvasLayout() {
  const colors = useNavigationTheme();

  return (
    <Stack screenOptions={getStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: "Canvas" }} />
    </Stack>
  );
}
