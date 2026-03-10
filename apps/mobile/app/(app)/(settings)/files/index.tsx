import { router } from "expo-router";
import { File, Folder } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { WorkspaceEntriesQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { QueryResult } from "../../../../src/shared/QueryResult";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Breadcrumbs({
  dirPath,
  onNavigate,
}: {
  dirPath: string;
  onNavigate: (path: string) => void;
}) {
  const segments = dirPath ? dirPath.split("/") : [];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row items-center gap-1 px-4 py-3"
      className="border-b border-neutral-800"
    >
      <Pressable onPress={() => onNavigate("")}>
        <Text className="text-sm text-indigo-400">/workspace</Text>
      </Pressable>
      {segments.map((seg, i) => {
        const partial = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <View key={partial} className="flex-row items-center gap-1">
            <Text className="text-sm text-neutral-600">/</Text>
            {isLast ? (
              <Text className="text-sm text-neutral-200">{seg}</Text>
            ) : (
              <Pressable onPress={() => onNavigate(partial)}>
                <Text className="text-sm text-indigo-400">{seg}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function FilesScreen() {
  const [dirPath, setDirPath] = useState("");
  const { data, loading, error } = useQuery(WorkspaceEntriesQuery, {
    path: dirPath,
  });

  const entries = data?.workspaceEntries ?? [];

  return (
    <View className="flex-1">
      <Breadcrumbs dirPath={dirPath} onNavigate={setDirPath} />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <QueryResult loading={loading} error={error} />

        {entries.map((entry) => (
          <Pressable
            key={entry.path}
            onPress={() => {
              if (entry.isDirectory) {
                setDirPath(entry.path);
              } else {
                router.push(
                  `/(app)/(settings)/files/view?path=${encodeURIComponent(entry.path)}`,
                );
              }
            }}
            className="flex-row items-center gap-3 px-4 py-3 border-b border-neutral-800/50 active:bg-neutral-900"
          >
            {entry.isDirectory ? (
              <Folder size={18} color="#818cf8" />
            ) : (
              <File size={18} color="#737373" />
            )}
            <Text className="text-sm text-neutral-200 flex-1" numberOfLines={1}>
              {entry.name}
            </Text>
            {!entry.isDirectory && entry.size != null && (
              <Text className="text-xs text-neutral-600 shrink-0">
                {formatSize(entry.size)}
              </Text>
            )}
          </Pressable>
        ))}

        {!loading && entries.length === 0 && (
          <Text className="px-4 py-8 text-sm text-neutral-500 text-center">
            Empty directory
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
