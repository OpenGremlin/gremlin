import type { ApolloError } from "@apollo/client";
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
  error?: ApolloError | string | null;
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
    const message =
      typeof error === "string"
        ? error
        : (error.message ?? "An error occurred");
    return (
      <View
        className="flex-1 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ErrorState message={message} onRetry={onRetry} />
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
