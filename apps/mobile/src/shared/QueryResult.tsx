import { Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { DelayedSpinner } from "./DelayedSpinner";
import { ErrorState } from "./ErrorState";

export function QueryResult({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
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

  if (error) {
    return (
      <View
        className="flex-1 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ErrorState message={error} onRetry={onRetry} />
      </View>
    );
  }

  return null;
}

export function NotFound({ label }: { label: string }) {
  return (
    <View className="px-4 pt-4">
      <Text className="text-text-muted">{label}</Text>
    </View>
  );
}
