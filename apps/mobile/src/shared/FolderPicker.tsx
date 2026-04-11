import { useQuery } from "@apollo/client";
import { ChevronRight, Folder } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { WorkspaceEntriesQuery } from "../graphql/queries";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

interface FolderPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (path: string) => void;
  /** Paths being moved — these folders will be hidden from the picker */
  excludePaths?: Set<string>;
}

export function FolderPicker({
  visible,
  onDismiss,
  onSelect,
  excludePaths,
}: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState("");
  const colors = useNavigationTheme();

  const { data, loading } = useQuery(WorkspaceEntriesQuery, {
    variables: { path: currentPath },
    skip: !visible,
  });

  const folders = (data?.workspaceEntries ?? []).filter(
    (e) => e.isDirectory && !excludePaths?.has(e.path),
  );

  const breadcrumbs = currentPath ? currentPath.split("/") : [];

  const navigateUp = useCallback(
    (index: number) => {
      if (index < 0) {
        setCurrentPath("");
      } else {
        setCurrentPath(breadcrumbs.slice(0, index + 1).join("/"));
      }
    },
    [breadcrumbs],
  );

  const handleSelect = useCallback(() => {
    onSelect(currentPath);
    setCurrentPath("");
  }, [currentPath, onSelect]);

  const handleDismiss = useCallback(() => {
    setCurrentPath("");
    onDismiss();
  }, [onDismiss]);

  const displayPath = currentPath || "/workspace";

  return (
    <BottomSheet visible={visible} title="Move to..." onDismiss={handleDismiss}>
      <View className="flex-1">
        {/* Breadcrumb nav */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row items-center gap-1 px-4 pb-2"
        >
          <Pressable onPress={() => navigateUp(-1)}>
            <Text className="text-sm text-accent">/workspace</Text>
          </Pressable>
          {breadcrumbs.map((seg, i) => (
            <View
              key={breadcrumbs.slice(0, i + 1).join("/")}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm text-text-faint">/</Text>
              {i === breadcrumbs.length - 1 ? (
                <Text className="text-sm text-text-secondary">{seg}</Text>
              ) : (
                <Pressable onPress={() => navigateUp(i)}>
                  <Text className="text-sm text-accent">{seg}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Folder list */}
        <ScrollView className="flex-1" contentContainerClassName="pb-4">
          {loading && (
            <View className="py-8 items-center">
              <ActivityIndicator />
            </View>
          )}
          {!loading && folders.length === 0 && (
            <Text className="px-4 py-8 text-sm text-text-muted text-center">
              No subfolders
            </Text>
          )}
          {folders.map((folder) => (
            <Pressable
              key={folder.path}
              onPress={() => setCurrentPath(folder.path)}
              className="flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle active:bg-surface"
            >
              <Folder size={18} color={colors.accentIndicator} />
              <Text
                className="text-sm text-text-secondary flex-1"
                numberOfLines={1}
              >
                {folder.name}
              </Text>
              <ChevronRight size={16} color={colors.iconDefault} />
            </Pressable>
          ))}
        </ScrollView>

        {/* Confirm button */}
        <View className="px-4 py-3 border-t border-app-border">
          <Button onPress={handleSelect} size="lg">
            {`Move here — ${displayPath}`}
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
