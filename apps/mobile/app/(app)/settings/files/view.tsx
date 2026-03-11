import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { WorkspaceFileQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { QueryResult } from "../../../../src/shared/QueryResult";

export default function FileViewScreen() {
  const { path } = useLocalSearchParams<{ path: string }>();
  const filePath = path ?? "";
  const fileName = filePath.split("/").pop() ?? filePath;

  const { data, loading, error } = useQuery(WorkspaceFileQuery, {
    path: filePath,
  });

  return (
    <View className="flex-1">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-sm font-medium text-text-secondary">
          {fileName}
        </Text>
        <Text className="text-xs text-text-faint mt-1">{filePath}</Text>
      </View>

      <QueryResult loading={loading} error={error} />

      {data?.workspaceFile != null ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-3"
          horizontal={false}
        >
          <Text className="text-xs text-text-secondary font-mono leading-5">
            {data.workspaceFile}
          </Text>
        </ScrollView>
      ) : (
        !loading &&
        !error && (
          <Text className="px-4 py-8 text-sm text-text-muted text-center">
            Unable to display file (binary or too large)
          </Text>
        )
      )}
    </View>
  );
}
