import { useMutation, useQuery } from "@apollo/client";
import { File, Paths } from "expo-file-system";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { Check, Folder, FolderPlus, FolderTree, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const INVALID_FOLDER_NAME = /[/\\\0]/;

import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  withTiming,
} from "react-native-reanimated";

const CHECKBOX_ANIM_IN_MS = 200;
const CHECKBOX_ANIM_OUT_MS = 150;
const CHECKBOX_SLIDE_DISTANCE = 16;

const checkboxEnter = () => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateX: -CHECKBOX_SLIDE_DISTANCE }],
    },
    animations: {
      opacity: withTiming(1, { duration: CHECKBOX_ANIM_IN_MS }),
      transform: [
        { translateX: withTiming(0, { duration: CHECKBOX_ANIM_IN_MS }) },
      ],
    },
  };
};

const checkboxExit = () => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: CHECKBOX_ANIM_OUT_MS }),
      transform: [
        {
          translateX: withTiming(-CHECKBOX_SLIDE_DISTANCE, {
            duration: CHECKBOX_ANIM_OUT_MS,
          }),
        },
      ],
    },
  };
};

import {
  AgentsQuery,
  AttachFileReferenceMutation,
  CreateWorkspaceFolderMutation,
  DeleteWorkspaceEntriesMutation,
  MoveWorkspaceEntriesMutation,
  WorkspaceEntriesQuery,
} from "../../../src/graphql/queries";
import { useDebounce } from "../../../src/hooks/useDebounce";
import {
  type FileSelectionState,
  useFileSelection,
} from "../../../src/hooks/useFileSelection";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { clientLogger } from "../../../src/lib/logger";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { ConfirmDialog } from "../../../src/shared/ConfirmDialog";
import { FolderPicker } from "../../../src/shared/FolderPicker";
import { FileTypeIcon } from "../../../src/shared/fileTypeAppearance";
import { presentPicker } from "../../../src/shared/PickerModal";
import { PromptDialog } from "../../../src/shared/PromptDialog";
import { QueryGate } from "../../../src/shared/QueryResult";
import { SearchInput } from "../../../src/shared/SearchInput";
import { SearchResults } from "../../../src/shared/SearchResults";
import { SelectionActionBar } from "../../../src/shared/SelectionActionBar";
import { TabScrollView } from "../../../src/shared/TabScrollView";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Breadcrumbs({ segments }: { segments: string[] }) {
  const colors = useNavigationTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row items-center gap-1 px-4 py-3"
      className="border-b border-app-border shrink-0 grow-0"
    >
      <View className="mr-2">
        <FolderTree size={18} color={colors.accentIndicator} />
      </View>
      <Pressable onPress={() => router.replace("/files")}>
        <Text className="text-base text-accent">/workspace</Text>
      </Pressable>
      {segments.map((seg, i) => {
        const partial = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <View key={partial} className="flex-row items-center gap-1">
            <Text className="text-base text-text-faint">/</Text>
            {isLast ? (
              <Text className="text-base text-text-secondary">{seg}</Text>
            ) : (
              <Pressable onPress={() => router.replace(`/files/${partial}`)}>
                <Text className="text-base text-accent">{seg}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function SelectionHeaderOverlay({
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
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(120)}
      className="absolute inset-0 flex-row items-center justify-between px-4 bg-bg"
    >
      <Text className="text-base font-semibold text-text-primary">
        {count} selected
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onSelectAll} hitSlop={8}>
          <Text className="text-base text-accent">Select All</Text>
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

function DirectoryView({
  dirPath,
  selection,
  selectAllRef,
  refetchRef,
}: {
  dirPath: string;
  selection: FileSelectionState;
  selectAllRef: React.MutableRefObject<() => void>;
  refetchRef: React.MutableRefObject<() => void>;
}) {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(WorkspaceEntriesQuery, {
    variables: { path: dirPath },
  });
  const entries = data?.workspaceEntries ?? [];
  const { refreshing, onRefresh } = useListRefresh(refetch);
  const [actionBusy, setActionBusy] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const [deleteEntries] = useMutation(DeleteWorkspaceEntriesMutation);
  const [moveEntries] = useMutation(MoveWorkspaceEntriesMutation);
  const [attachFileReference] = useMutation(AttachFileReferenceMutation);
  const { data: agentsData } = useQuery(AgentsQuery);
  const agents = useMemo(
    () => (agentsData?.agents ?? []).filter((a) => !a.retired),
    [agentsData?.agents],
  );

  const { selectAll } = selection;
  useEffect(() => {
    selectAllRef.current = () => selectAll(entries.map((e) => e.path));
  }, [entries, selectAll, selectAllRef]);

  useEffect(() => {
    refetchRef.current = () => refetch();
  }, [refetch, refetchRef]);

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

  const handleDiscuss = useCallback(() => {
    const paths = [...selection.selectedPaths];
    if (paths.length === 0 || agents.length === 0) return;
    presentPicker({
      title: "Discuss with",
      options: agents.map((a) => ({
        value: a.id,
        label: a.name,
        subtitle: a.role ?? undefined,
        icon: <AgentAvatar id={a.id} size={28} />,
      })),
      onSelect: (agentId) => {
        selection.clearSelection();
        router.push(`/agents/${agentId}`);
        attachFileReference({
          variables: { input: { agentId, filePaths: paths } },
        }).catch((err) => {
          clientLogger.error("Failed to attach file references", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      },
    });
  }, [selection, agents, attachFileReference]);

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
        <TabScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {entries.map((entry) => {
            const isSelected = selection.selectedPaths.has(entry.path);
            return (
              <Animated.View
                key={entry.path}
                layout={LinearTransition.duration(200)}
              >
                <Pressable
                  onPress={() => handlePress(entry)}
                  onLongPress={() => handleLongPress(entry)}
                  delayLongPress={400}
                  className={`flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle active:bg-surface ${
                    isSelected ? "bg-accent-surface/40" : ""
                  }`}
                >
                  {selection.isSelectionMode && (
                    <Animated.View
                      key="checkbox"
                      entering={checkboxEnter}
                      exiting={checkboxExit}
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
                    className="text-lg text-text-secondary flex-1"
                    numberOfLines={1}
                  >
                    {entry.name}
                  </Text>
                  {!entry.isDirectory && entry.size != null && (
                    <Text className="text-sm text-text-faint shrink-0">
                      {formatSize(entry.size)}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {!loading && entries.length === 0 && (
            <Text className="px-4 py-8 text-base text-text-muted text-center">
              Empty directory
            </Text>
          )}
        </TabScrollView>

        {selection.isSelectionMode && selection.count > 0 && (
          <SelectionActionBar
            onDiscuss={agents.length > 0 ? handleDiscuss : undefined}
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

  const selection = useFileSelection();
  const selectAllRef = useRef<() => void>(() => {});
  const refetchRef = useRef<() => void>(() => {});
  const { clearSelection } = selection;
  const prevWorkspacePath = useRef(workspacePath);
  useEffect(() => {
    if (prevWorkspacePath.current !== workspacePath) {
      prevWorkspacePath.current = workspacePath;
      clearSelection();
    }
  }, [workspacePath, clearSelection]);

  useFocusEffect(
    useCallback(() => {
      refetchRef.current();
    }, []),
  );

  const colors = useNavigationTheme();
  const [createFolder] = useMutation(CreateWorkspaceFolderMutation);
  const [showNewFolder, setShowNewFolder] = useState(false);

  const validateFolderName = useCallback((name: string) => {
    if (INVALID_FOLDER_NAME.test(name)) {
      return "Folder name cannot contain / or \\ characters.";
    }
    return null;
  }, []);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      setShowNewFolder(false);
      const folderPath = workspacePath ? `${workspacePath}/${name}` : name;
      try {
        await createFolder({ variables: { path: folderPath } });
        refetchRef.current();
      } catch (e) {
        Alert.alert("Failed to create folder", (e as Error).message);
      }
    },
    [workspacePath, createFolder],
  );

  return (
    <View className="flex-1">
      <Breadcrumbs segments={segments} />
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <View className="flex-1">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files..."
          />
        </View>
        <Pressable
          onPress={() => setShowNewFolder(true)}
          hitSlop={8}
          style={{ borderCurve: "continuous" }}
          className="p-2 rounded-lg bg-accent-surface active:bg-accent-surface/80"
        >
          <FolderPlus size={20} color={colors.accent} />
        </Pressable>
        {selection.isSelectionMode && (
          <SelectionHeaderOverlay
            count={selection.count}
            onSelectAll={() => selectAllRef.current()}
            onDone={clearSelection}
          />
        )}
      </View>
      {debouncedQuery ? (
        <SearchResults query={debouncedQuery} />
      ) : (
        <DirectoryView
          dirPath={workspacePath}
          selection={selection}
          selectAllRef={selectAllRef}
          refetchRef={refetchRef}
        />
      )}

      <PromptDialog
        visible={showNewFolder}
        title="New Folder"
        message="Enter a name for the new folder."
        placeholder="Folder name"
        confirmLabel="Create"
        validate={validateFolderName}
        onConfirm={handleCreateFolder}
        onCancel={() => setShowNewFolder(false)}
      />
    </View>
  );
}
