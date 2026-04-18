import { useQuery, useSubscription } from "@apollo/client";
import { router, useFocusEffect } from "expo-router";
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
  PostCreatedSubscription,
  PostsQuery,
} from "../../../src/graphql/queries/posts";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { useTabBarHeight } from "../../../src/hooks/useTabBarHeight";
import { agentNameColor } from "../../../src/lib/color";
import { usePendingCount } from "../../../src/lib/PendingCountContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { EmptyState } from "../../../src/shared/EmptyState";
import { FileCard } from "../../../src/shared/FileCard";
import { filesFromAttachments } from "../../../src/shared/FilePreview";
import { timeAgo } from "../../../src/shared/formatDate";
import { groupFiles } from "../../../src/shared/groupFiles";
import { ImageCollage } from "../../../src/shared/ImageCollage";
import { PendingApprovals } from "../../../src/shared/PendingApprovals";
import { PendingInputRequests } from "../../../src/shared/PendingInputRequests";
import { QueryResult } from "../../../src/shared/QueryResult";

type PostItem = {
  id: string;
  taskId: string;
  title: string;
  message: string;
  createdAt: string;
  agent?: { id: string; name?: string; hexColor?: string | null } | null;
  attachments?: readonly AttachmentFieldsFragment[];
};

const PostCard = memo(function PostCard({ item }: { item: PostItem }) {
  const { agent } = item;
  const openPager = (initialIndex: number) => {
    const file = files[initialIndex];
    if (file)
      router.push({
        pathname: "/file/[...path]",
        params: { path: file.path.split("/"), post: item.id },
      });
  };

  const files = useMemo(
    () => filesFromAttachments(item.attachments ?? []),
    [item.attachments],
  );
  const groups = useMemo(() => groupFiles(files), [files]);

  return (
    <Pressable
      onPress={() => router.push(`/tasks/${item.taskId}`)}
      className="px-4 py-4 active:bg-surface/50"
    >
      <View className="flex-row items-start gap-3">
        <Pressable onPress={() => agent && router.push(`/agents/${agent.id}`)}>
          <AgentAvatar id={agent?.id ?? ""} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 min-w-0">
            {agent?.name ? (
              <Text
                className="text-sm font-bold"
                style={{ color: agentNameColor(agent.hexColor) }}
                numberOfLines={1}
              >
                {agent.name}
              </Text>
            ) : null}
            <Text className="text-xs text-text-faint shrink-0">
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text className="text-lg font-medium text-text-secondary mt-0.5">
            {item.title}
          </Text>
          {item.message ? (
            <Text
              className="text-base text-text-muted mt-0.5"
              numberOfLines={3}
            >
              {item.message}
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

const renderPostItem = ({ item }: { item: PostItem }) => (
  <PostCard item={item} />
);
const keyExtractor = (item: PostItem) => item.id;

const PAGE_SIZE = 20;

export default function HomeScreen() {
  const colors = useNavigationTheme();
  const tabBarHeight = useTabBarHeight();
  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: tabBarHeight }),
    [tabBarHeight],
  );
  const { data, loading, error, refetch, fetchMore, updateQuery } = useQuery(
    PostsQuery,
    {
      variables: { last: PAGE_SIZE },
    },
  );
  const [loadingMore, setLoadingMore] = useState(false);

  // Listen for new posts and prepend them to the feed
  useSubscription(PostCreatedSubscription, {
    onData: ({ data: { data: subData } }) => {
      if (!subData?.postCreated) return;
      const newPost = subData.postCreated;
      updateQuery((prev) => {
        if (!prev?.posts) return prev;
        // Avoid duplicates
        const exists = prev.posts.edges.some((e) => e.node.id === newPost.id);
        if (exists) return prev;
        return {
          ...prev,
          posts: {
            ...prev.posts,
            edges: [
              ...prev.posts.edges,
              { __typename: "PostEdge" as const, cursor: "", node: newPost },
            ],
          },
        };
      });
    },
  });

  const connection = data?.posts;
  const nodes: PostItem[] = useMemo(
    () =>
      (connection?.edges ?? [])
        .map((e) => e.node)
        .filter((n) => n.agent)
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

  const refreshAll = useCallback(() => {
    refetch();
    refetchApprovals();
    refetchInputRequests();
  }, [refetch, refetchApprovals, refetchInputRequests]);

  const { refreshing, onRefresh } = useListRefresh(refreshAll);
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) loadMore();
  }, [hasMore, loadingMore, loadMore]);
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll]),
  );

  if ((loading || error) && nodes.length === 0) {
    return <QueryResult loading={loading} error={error} onRetry={refetch} />;
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={contentContainerStyle}
      data={nodes}
      keyExtractor={keyExtractor}
      renderItem={renderPostItem}
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
      onEndReached={handleEndReached}
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
            message="No posts yet"
            description="Posts appear here when tasks are completed."
            icon={<Home size={32} color={colors.iconMuted} />}
          />
        ) : null
      }
    />
  );
}
