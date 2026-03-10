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
      {loading && <Text className="text-sm text-neutral-500">Loading...</Text>}
      {error && <Text className="text-sm text-red-400">Error: {error}</Text>}
    </View>
  );
}

export function NotFound({ label }: { label: string }) {
  return (
    <View className="px-4 pt-4">
      <Text className="text-neutral-400">{label}</Text>
    </View>
  );
}
