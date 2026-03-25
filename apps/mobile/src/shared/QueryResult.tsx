import { Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { DelayedSpinner } from "./DelayedSpinner";

export function QueryResult({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  const colors = useNavigationTheme();

  if (!loading && !error) return null;

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <DelayedSpinner />
      </View>
    );
  }

  return (
    <View className="px-4 pt-4">
      {error && <Text className="text-sm text-error">Error: {error}</Text>}
    </View>
  );
}

export function NotFound({ label }: { label: string }) {
  return (
    <View className="px-4 pt-4">
      <Text className="text-text-muted">{label}</Text>
    </View>
  );
}
