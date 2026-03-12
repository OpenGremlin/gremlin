import { Text, View } from "react-native";

export function QueryResult({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  if (!loading && !error) return null;

  return (
    <View className="px-4 pt-4">
      {loading && <Text className="text-sm text-text-muted">Loading...</Text>}
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
