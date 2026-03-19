import { router } from "expo-router";
import { Home } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import type { AgentLogsQuery } from "../../../src/graphql/generated/graphql";
import { TasksQuery } from "../../../src/graphql/queries";
import { usePaginatedQuery } from "../../../src/hooks/usePaginatedQuery";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { EmptyState } from "../../../src/shared/EmptyState";
import { FileCard } from "../../../src/shared/FileCard";
import { timeAgo } from "../../../src/shared/formatDate";
import { QueryResult } from "../../../src/shared/QueryResult";
import { useTaskUpdates } from "../../../src/subscriptions";

function ListSeparator() {
  return <View className="h-px bg-border-subtle mx-4" />;
}

type FileNode =
  AgentLogsQuery["agentLogs"]["edges"][number]["node"]["files"][number];

type TaskItem = {
  id: string;
  title: string;
  createdAt: string;
  agent: { id: string; name?: string };
  message?: string | null;
  imageUrl?: string | null;
  files?: FileNode[];
};

function TaskCard({ item }: { item: TaskItem }) {
  const [override, setOverride] = useState<Partial<TaskItem>>({});
  const task = { ...item, ...override };
  const { agent } = task;

  useTaskUpdates(
    item.id,
    useCallback((data) => {
      setOverride((prev) => ({ ...prev, ...data }) as Partial<TaskItem>);
    }, []),
  );

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
          {task.files && task.files.length > 0 ? (
            <View className="mt-2 gap-1" onStartShouldSetResponder={() => true}>
              {task.files.map((file) => (
                <FileCard key={file.path} file={file} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useNavigationTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { nodes, loading, loadingMore, error, hasMore, loadMore, refetch } =
    usePaginatedQuery(TasksQuery, (d) => d.tasks, undefined, {
      direction: "newest-first",
    });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading && nodes.length === 0) {
    return <QueryResult loading={loading} error={error} />;
  }

  return (
    <FlatList
      data={nodes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard item={item} />}
      ItemSeparatorComponent={ListSeparator}
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
