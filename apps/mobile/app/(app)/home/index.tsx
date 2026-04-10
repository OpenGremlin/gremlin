import { useQuery, useSubscription } from "@apollo/client";
import { router } from "expo-router";
import { Home } from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import type { AttachmentFieldsFragment } from "../../../src/graphql/generated/graphql";
import {
  TasksQuery,
  TaskUpdatedSubscription,
} from "../../../src/graphql/queries";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { usePendingCount } from "../../../src/lib/PendingCountContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { EmptyState } from "../../../src/shared/EmptyState";
import { FileCard } from "../../../src/shared/FileCard";
import {
  type FileNode,
  filesFromAttachments,
} from "../../../src/shared/FilePreview";
import { timeAgo } from "../../../src/shared/formatDate";
import {
  ImageCollage,
  type ImageFile,
  isImageFile,
} from "../../../src/shared/ImageCollage";
import { PendingApprovals } from "../../../src/shared/PendingApprovals";
import { PendingInputRequests } from "../../../src/shared/PendingInputRequests";
import { QueryResult } from "../../../src/shared/QueryResult";

function ListSeparator() {
  return <View className="h-px bg-border-subtle mx-4" />;
}

type TaskItem = {
  id: string;
  title: string;
  createdAt: string;
  agent: { id: string; name?: string };
  message?: string | null;
  emoji?: string | null;
  attachments?: readonly AttachmentFieldsFragment[];
};

/**
 * Group consecutive image files into collage blocks while preserving the
 * original interleaved order. Each entry is either a single non-image file or
 * a run of >=1 images. Indices into the original `files` array are kept so a
 * tap can open the unified pager at the right page.
 */
type FileGroup =
  | { kind: "file"; file: FileNode; index: number }
  | { kind: "images"; files: ImageFile[]; indices: number[] };

function groupFiles(files: FileNode[]): FileGroup[] {
  const groups: FileGroup[] = [];
  let run: { files: ImageFile[]; indices: number[] } | null = null;
  const flush = () => {
    if (run) {
      groups.push({ kind: "images", files: run.files, indices: run.indices });
      run = null;
    }
  };
  files.forEach((file, index) => {
    if (isImageFile(file)) {
      if (!run) run = { files: [], indices: [] };
      run.files.push(file);
      run.indices.push(index);
    } else {
      flush();
      groups.push({ kind: "file", file, index });
    }
  });
  flush();
  return groups;
}

const TaskCard = memo(function TaskCard({ item }: { item: TaskItem }) {
  const [override, setOverride] = useState<Partial<TaskItem>>({});
  const task = { ...item, ...override };
  const { agent } = task;
  const openPager = (initialIndex: number) => {
    const file = files[initialIndex];
    if (file)
      router.push({
        pathname: "/file/[...path]",
        params: { path: file.path.split("/"), task: item.id },
      });
  };

  useSubscription(TaskUpdatedSubscription, {
    variables: { taskId: item.id },
    onData: ({ data: { data } }) => {
      if (data) {
        setOverride(
          (prev) => ({ ...prev, ...data.taskUpdated }) as Partial<TaskItem>,
        );
      }
    },
  });

  const files = useMemo(
    () => filesFromAttachments(task.attachments ?? []),
    [task.attachments],
  );
  const groups = useMemo(() => groupFiles(files), [files]);

  return (
    <Pressable
      onPress={() => router.push(`/agents/${agent.id}/tasks/${task.id}`)}
      className="px-4 py-4 active:bg-surface/50"
    >
      <View className="flex-row items-start gap-3">
        <Pressable onPress={() => router.push(`/agents/${agent.id}`)}>
          <AgentAvatar id={agent.id} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 min-w-0">
            {agent.name ? (
              <Text className="text-sm text-text-muted" numberOfLines={1}>
                {agent.name}
              </Text>
            ) : null}
            <Text className="text-xs text-text-faint shrink-0">
              {timeAgo(task.createdAt)}
            </Text>
          </View>
          <Text className="text-base font-medium text-text-primary mt-0.5">
            {task.title}
          </Text>
          {task.message ? (
            <Text className="text-sm text-text-muted mt-0.5" numberOfLines={1}>
              {task.message}
            </Text>
          ) : null}
          {files.length > 0 ? (
            <View className="mt-2 gap-1" onStartShouldSetResponder={() => true}>
              {groups.map((group) => {
                if (group.kind === "images") {
                  return (
                    <ImageCollage
                      key={`images-${group.indices[0]}`}
                      images={group.files}
                      onPressImage={(i) => openPager(group.indices[i])}
                    />
                  );
                }
                return (
                  <FileCard
                    key={`${group.file.path}-${group.index}`}
                    file={group.file}
                    onPress={() => openPager(group.index)}
                  />
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const renderTaskItem = ({ item }: { item: TaskItem }) => (
  <TaskCard item={item} />
);
const keyExtractor = (item: TaskItem) => item.id;

const PAGE_SIZE = 20;

export default function HomeScreen() {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch, fetchMore } = useQuery(TasksQuery, {
    variables: { last: PAGE_SIZE },
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const connection = data?.tasks;
  const nodes: TaskItem[] = useMemo(
    () =>
      (connection?.edges ?? [])
        .map((e) => e.node)
        .slice()
        .reverse(),
    [connection?.edges],
  );
  const hasMore = connection?.pageInfo?.hasPreviousPage ?? false;

  const loadMore = useCallback(async () => {
    if (!connection?.pageInfo?.startCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { last: PAGE_SIZE, before: connection.pageInfo.startCursor },
      });
    } finally {
      setLoadingMore(false);
    }
  }, [connection?.pageInfo?.startCursor, loadingMore, fetchMore]);
  const {
    approvals,
    inputRequests: pendingInputRequests,
    refetchApprovals,
    refetchInputRequests,
  } = usePendingCount();

  const { refreshing, onRefresh } = useListRefresh(() => {
    refetch();
    refetchApprovals();
    refetchInputRequests();
  });

  if ((loading || error) && nodes.length === 0) {
    return <QueryResult loading={loading} error={error} onRetry={refetch} />;
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={nodes}
      keyExtractor={keyExtractor}
      renderItem={renderTaskItem}
      ItemSeparatorComponent={ListSeparator}
      ListHeaderComponent={
        approvals.length > 0 || pendingInputRequests.length > 0 ? (
          <View>
            <PendingApprovals
              approvals={approvals}
              onResolved={refetchApprovals}
            />
            <PendingInputRequests
              requests={pendingInputRequests}
              onResolved={refetchInputRequests}
            />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.loadingIndicator}
        />
      }
      onEndReached={() => {
        if (hasMore && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={colors.loadingIndicator} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            message="No tasks yet"
            description="Start a conversation with an agent to see tasks here."
            icon={<Home size={32} color={colors.iconMuted} />}
          />
        ) : null
      }
    />
  );
}
