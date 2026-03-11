import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import type { Document } from "../../../src/graphql/generated/graphql";
import { TasksQuery } from "../../../src/graphql/queries";
import { usePaginatedQuery } from "../../../src/hooks/usePaginatedQuery";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { DocumentCard } from "../../../src/shared/DocumentCard";
import { timeAgo } from "../../../src/shared/formatDate";
import { QueryResult } from "../../../src/shared/QueryResult";
import { useTaskUpdates } from "../../../src/subscriptions";

function ListSeparator() {
  return <View className="h-px bg-neutral-800/50 mx-4" />;
}

type TaskItem = {
  id: string;
  title: string;
  createdAt: string;
  agent: { id: string; name?: string };
  message?: string | null;
  imageUrl?: string | null;
  documents?: Array<Document>;
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
      className="px-4 py-4 active:bg-neutral-900/50"
    >
      <View className="flex-row items-start gap-3">
        <Pressable onPress={() => router.push(`/agents/${agent.id}`)}>
          <AgentAvatar id={agent.id} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 min-w-0">
            {agent.name ? (
              <Text className="text-sm text-neutral-400" numberOfLines={1}>
                {agent.name}
              </Text>
            ) : null}
            <Text className="text-xs text-neutral-600 shrink-0">
              {timeAgo(task.createdAt)}
            </Text>
          </View>
          <Text className="text-sm font-medium text-neutral-100 mt-0.5">
            {task.title}
          </Text>
          {task.message ? (
            <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
              {task.message}
            </Text>
          ) : null}
          {task.documents && task.documents.length > 0 ? (
            <View className="mt-2 gap-1">
              {task.documents.map((doc) => (
                <DocumentCard key={doc.path} doc={doc} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { nodes, loading, loadingMore, error, hasMore, loadMore } =
    usePaginatedQuery(TasksQuery, (d) => d.tasks, undefined, {
      direction: "newest-first",
    });

  if (loading && nodes.length === 0) {
    return <QueryResult loading={loading} error={error} />;
  }

  return (
    <FlatList
      data={nodes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard item={item} />}
      ItemSeparatorComponent={ListSeparator}
      onEndReached={() => {
        if (hasMore && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#737373" />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View className="items-center py-12">
            <Text className="text-neutral-500 text-sm">No tasks yet</Text>
          </View>
        ) : null
      }
    />
  );
}
