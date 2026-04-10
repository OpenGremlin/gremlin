import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { File, Folder } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { WorkspaceEntriesQuery } from "../../../src/graphql/queries";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { QueryGate } from "../../../src/shared/QueryResult";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Breadcrumbs({ segments }: { segments: string[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row items-center gap-1 px-4 py-3"
      className="border-b border-app-border shrink-0 grow-0"
    >
      <Pressable onPress={() => router.replace("/files")}>
        <Text className="text-sm text-accent">/workspace</Text>
      </Pressable>
      {segments.map((seg, i) => {
        const partial = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <View key={partial} className="flex-row items-center gap-1">
            <Text className="text-sm text-text-faint">/</Text>
            {isLast ? (
              <Text className="text-sm text-text-secondary">{seg}</Text>
            ) : (
              <Pressable onPress={() => router.replace(`/files/${partial}`)}>
                <Text className="text-sm text-accent">{seg}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function DirectoryView({ dirPath }: { dirPath: string }) {
  const colors = useNavigationTheme();
  const { data, loading, error } = useQuery(WorkspaceEntriesQuery, {
    variables: { path: dirPath },
  });
  const entries = data?.workspaceEntries ?? [];

  const openFile = useCallback(
    (entry: (typeof entries)[number]) => {
      router.push({
        pathname: "/file/[...path]",
        params: { path: entry.path.split("/"), dir: dirPath },
      });
    },
    [dirPath],
  );

  return (
    <QueryGate loading={loading} error={error} data={data}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerClassName="pb-6"
      >
        {entries.map((entry) => (
          <Pressable
            key={entry.path}
            onPress={() =>
              entry.isDirectory
                ? router.replace(`/files/${entry.path}`)
                : openFile(entry)
            }
            className="flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle active:bg-surface"
          >
            {entry.isDirectory ? (
              <Folder size={18} color={colors.accentIndicator} />
            ) : (
              <File size={18} color={colors.iconMuted} />
            )}
            <Text
              className="text-sm text-text-secondary flex-1"
              numberOfLines={1}
            >
              {entry.name}
            </Text>
            {!entry.isDirectory && entry.size != null && (
              <Text className="text-xs text-text-faint shrink-0">
                {formatSize(entry.size)}
              </Text>
            )}
          </Pressable>
        ))}

        {!loading && entries.length === 0 && (
          <Text className="px-4 py-8 text-sm text-text-muted text-center">
            Empty directory
          </Text>
        )}
      </ScrollView>
    </QueryGate>
  );
}

export default function FilesScreen() {
  const { path: pathParam } = useLocalSearchParams<{ path: string[] }>();
  const workspacePath = pathParam?.join("/") ?? "";
  const segments = workspacePath ? workspacePath.split("/") : [];

  return (
    <View className="flex-1">
      <Breadcrumbs segments={segments} />
      <DirectoryView dirPath={workspacePath} />
    </View>
  );
}
