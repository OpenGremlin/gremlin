import { useMutation, useQuery } from "@apollo/client";
import { File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { Check, Folder, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  DeleteWorkspaceEntriesMutation,
  MoveWorkspaceEntriesMutation,
  WorkspaceEntriesQuery,
} from "../../../src/graphql/queries";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useFileSelection } from "../../../src/hooks/useFileSelection";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { ConfirmDialog } from "../../../src/shared/ConfirmDialog";
import { FolderPicker } from "../../../src/shared/FolderPicker";
import { FileTypeIcon } from "../../../src/shared/fileTypeAppearance";
import { QueryGate } from "../../../src/shared/QueryResult";
import { SearchInput } from "../../../src/shared/SearchInput";
import { SelectionActionBar } from "../../../src/shared/SelectionActionBar";
import { SearchResults } from "./SearchResults";

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

function SelectionHeader({
  count,
  onSelectAll,
  onDone,
}: {
  count: number;
  onSelectAll: () => void;
  onDone: () => void;
}) {
  const colors = useNavigationTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="flex-row items-center justify-between px-4 py-2 border-b border-app-border bg-surface"
    >
      <Text className="text-sm font-semibold text-text-primary">
        {count} selected
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onSelectAll} hitSlop={8}>
          <Text className="text-sm text-accent">Select All</Text>
        </Pressable>
        <Pressable
          onPress={onDone}
          hitSlop={8}
          className="w-7 h-7 rounded-full bg-surface-alt items-center justify-center"
        >
          <X size={14} color={colors.iconDefault} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function DirectoryView({ dirPath }: { dirPath: string }) {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(WorkspaceEntriesQuery, {
    variables: { path: dirPath },
  });
  const entries = data?.workspaceEntries ?? [];
  const { refreshing, onRefresh } = useListRefresh(refetch);
  const selection = useFileSelection();
  const [actionBusy, setActionBusy] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const [deleteEntries] = useMutation(DeleteWorkspaceEntriesMutation);
  const [moveEntries] = useMutation(MoveWorkspaceEntriesMutation);

  // Clear selection when navigating to a different directory
  const prevDirPath = useRef(dirPath);
  useEffect(() => {
    if (prevDirPath.current !== dirPath) {
      selection.clearSelection();
      prevDirPath.current = dirPath;
    }
  }, [dirPath, selection]);

  const openFile = useCallback(
    (entry: (typeof entries)[number]) => {
      router.push({
        pathname: "/file/[...path]",
        params: { path: entry.path.split("/"), dir: dirPath },
      });
    },
    [dirPath],
  );

  const handlePress = useCallback(
    (entry: (typeof entries)[number]) => {
      if (selection.isSelectionMode) {
        selection.toggleItem(entry.path);
      } else if (entry.isDirectory) {
        router.replace(`/files/${entry.path}`);
      } else {
        openFile(entry);
      }
    },
    [selection, openFile],
  );

  const handleLongPress = useCallback(
    (entry: (typeof entries)[number]) => {
      if (!selection.isSelectionMode) {
        selection.enterSelectionMode(entry.path);
      }
    },
    [selection],
  );

  // --- Actions ---

  const selectedFiles = entries.filter((e) =>
    selection.selectedPaths.has(e.path),
  );
  const fileCount = selectedFiles.filter((e) => !e.isDirectory).length;
  const folderCount = selectedFiles.filter((e) => e.isDirectory).length;

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setActionBusy(true);
    const paths = [...selection.selectedPaths];
    try {
      await deleteEntries({ variables: { paths } });
      selection.clearSelection();
      refetch();
    } catch (e) {
      Alert.alert("Delete failed", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }, [selection, deleteEntries, refetch]);

  const handleShare = useCallback(async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available on this device");
      return;
    }
    // Write selected file names to a temp text file and share it
    const names = selectedFiles.map((e) => e.name).join("\n");
    const tmp = new File(Paths.cache, "selection-share", "selected-files.txt");
    if (tmp.exists) tmp.delete();
    tmp.create({ intermediates: true });
    tmp.write(names);
    await Sharing.shareAsync(tmp.uri, {
      mimeType: "text/plain",
      dialogTitle: `${selectedFiles.length} files`,
    });
  }, [selectedFiles]);

  const handleMove = useCallback(
    async (destination: string) => {
      setShowFolderPicker(false);
      setActionBusy(true);
      const paths = [...selection.selectedPaths];
      try {
        await moveEntries({ variables: { paths, destination } });
        selection.clearSelection();
        refetch();
      } catch (e) {
        Alert.alert("Move failed", (e as Error).message);
      } finally {
        setActionBusy(false);
      }
    },
    [selection, moveEntries, refetch],
  );

  const deleteMessage = [
    fileCount > 0 ? `${fileCount} file${fileCount > 1 ? "s" : ""}` : "",
    folderCount > 0 ? `${folderCount} folder${folderCount > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <QueryGate loading={loading} error={error} data={data}>
      <View className="flex-1">
        {selection.isSelectionMode && (
          <SelectionHeader
            count={selection.count}
            onSelectAll={() => selection.selectAll(entries.map((e) => e.path))}
            onDone={selection.clearSelection}
          />
        )}

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          className="flex-1"
          contentContainerClassName="pb-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {entries.map((entry) => {
            const isSelected = selection.selectedPaths.has(entry.path);
            return (
              <Pressable
                key={entry.path}
                onPress={() => handlePress(entry)}
                onLongPress={() => handleLongPress(entry)}
                delayLongPress={400}
                className={`flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle active:bg-surface ${
                  isSelected ? "bg-accent-surface/40" : ""
                }`}
              >
                {selection.isSelectionMode && (
                  <Animated.View
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(100)}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center ${
                        isSelected
                          ? "bg-accent border-accent"
                          : "border-text-faint"
                      }`}
                    >
                      {isSelected && <Check size={12} color="white" />}
                    </View>
                  </Animated.View>
                )}
                {entry.isDirectory ? (
                  <Folder size={18} color={colors.accentIndicator} />
                ) : (
                  <FileTypeIcon fileType={entry.fileType} />
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
            );
          })}

          {!loading && entries.length === 0 && (
            <Text className="px-4 py-8 text-sm text-text-muted text-center">
              Empty directory
            </Text>
          )}
        </ScrollView>

        {selection.isSelectionMode && selection.count > 0 && (
          <SelectionActionBar
            onDelete={() => setShowDeleteConfirm(true)}
            onShare={handleShare}
            onMove={() => setShowFolderPicker(true)}
            disabled={actionBusy}
          />
        )}

        <ConfirmDialog
          visible={showDeleteConfirm}
          title="Delete files"
          message={`Are you sure you want to delete ${deleteMessage}? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        <FolderPicker
          visible={showFolderPicker}
          onDismiss={() => setShowFolderPicker(false)}
          onSelect={handleMove}
          excludePaths={selection.selectedPaths}
        />
      </View>
    </QueryGate>
  );
}

export default function FilesScreen() {
  const { path: pathParam, q } = useLocalSearchParams<{
    path: string[];
    q?: string | string[];
  }>();
  const workspacePath = pathParam?.join("/") ?? "";
  const segments = workspacePath ? workspacePath.split("/") : [];
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  // Re-seed when the tab is already mounted and we're deep-linked with a new
  // `q` (e.g. from the file-not-found sheet's Search CTA).
  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialQuery]);
  const debouncedQuery = useDebounce(searchQuery);

  return (
    <View className="flex-1">
      <Breadcrumbs segments={segments} />
      <View className="px-4 py-2">
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search files..."
        />
      </View>
      {debouncedQuery ? (
        <SearchResults query={debouncedQuery} />
      ) : (
        <DirectoryView dirPath={workspacePath} />
      )}
    </View>
  );
}
