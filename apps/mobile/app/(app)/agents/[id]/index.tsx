import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hexToTransparent } from "../../../../src/lib/color";
import { AgentQuery, TaskQuery } from "../../../../src/graphql/queries";
import { useChatSend } from "../../../../src/hooks/useChatSend";
import { useFileUpload } from "../../../../src/hooks/useFileUpload";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../../../src/hooks/useLogMessages";
import { useQuery } from "../../../../src/hooks/useQuery";
import { useSandboxOutput } from "../../../../src/hooks/useSandboxOutput";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { ChatHeaderTitle } from "../../../../src/shared/ChatHeaderTitle";
import { ChatInputBar } from "../../../../src/shared/ChatInputBar";
import { LogEntryView } from "../../../../src/shared/LogEntryView";
import { PendingMessageBubble } from "../../../../src/shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function AgentChatScreen() {
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId?: string;
  }>();

  const scope = useMemo(
    () => (taskId ? { taskId } : { agentId: id }),
    [id, taskId],
  );

  const { messages, loading, hasMore, loadMore, loadingMore } =
    useLogMessages(scope);
  const {
    data: agentData,
    loading: agentLoading,
    error: agentError,
  } = useQuery(AgentQuery, { id: id ?? "" });
  const { data: taskData } = useQuery(
    TaskQuery,
    taskId ? { id: taskId } : ({ id: "" } as const),
  );

  const { input, setInput, pendingMessages, listRef, handleSend } = useChatSend(
    { agentId: id, taskId, messages },
  );

  const sandboxStreams = useSandboxOutput(taskId ?? "");

  const { uploads, uploadFiles, clearUploads, isUploading } = useFileUpload(
    id,
    taskId,
  );

  // Auto-clear finished uploads after 3 seconds
  useEffect(() => {
    if (uploads.length === 0) return;
    const allDone = uploads.every(
      (u) => u.status === "done" || u.status === "error",
    );
    if (!allDone) return;
    const timer = setTimeout(() => clearUploads(), 3000);
    return () => clearTimeout(timer);
  }, [uploads, clearUploads]);

  const handlePickFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0)
        return;
      const files = result.assets.map((asset) => ({
        name: asset.name,
        size: asset.size ?? 0,
        type: asset.mimeType ?? "application/octet-stream",
        uri: asset.uri,
      }));
      uploadFiles(files);
    } catch {
      // User cancelled or error
    }
  }, [uploadFiles]);

  const agent = agentData?.agent;
  const task = taskData?.task;
  const taskDocs = task?.documents;
  const isTaskView = !!taskId;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const next = index > 0 ? messages[index - 1] : undefined;
      const show = shouldShowTimestamp(item, next);
      return (
        <LogEntryView
          message={item}
          agentId={id}
          showTimestamp={show}
          documents={taskDocs}
          sandboxStreams={isTaskView ? sandboxStreams : undefined}
        />
      );
    },
    [messages, id, taskDocs, isTaskView, sandboxStreams],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (agentLoading || loading) {
    return <QueryResult loading error={null} />;
  }
  if (agentError) {
    return <QueryResult loading={false} error={agentError} />;
  }
  if (!agent) {
    return <NotFound label="Agent not found" />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {taskId && task && (
        <View className="px-4 py-2 bg-surface/80 border-b border-app-border">
          <Text className="text-xs text-text-muted">Task</Text>
          <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
            🛠️ {task.title ?? task.message}
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 140,
        }}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-3">
              <ActivityIndicator size="small" color={colors.loadingIndicator} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          pendingMessages.length > 0 ? (
            <View>
              {pendingMessages.map((content) => (
                <PendingMessageBubble key={content} content={content} />
              ))}
            </View>
          ) : null
        }
      />

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
        }}
      >
        <LinearGradient
          colors={[colors.background, colors.background, hexToTransparent(colors.background)]}
          locations={[0, 0.6, 1]}
          style={{
            paddingTop: Platform.OS === "ios" ? insets.top + 8 : 12,
            paddingBottom: 40,
          }}
        >
          {Platform.OS !== "web" && (
            <Pressable
              onPress={() => router.back()}
              style={{
                position: "absolute",
                top: Platform.OS === "ios" ? insets.top + 4 : 8,
                left: 8,
                zIndex: 3,
                padding: 8,
              }}
            >
              <ChevronLeft size={24} color={colors.headerText} />
            </Pressable>
          )}
          <View style={{ alignItems: "center" }}>
            <ChatHeaderTitle
              agentId={id}
              title={agent.name}
              onPress={() => router.push(`/agents/${id}/config`)}
            />
          </View>
        </LinearGradient>
      </View>

      <ChatInputBar
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={!!agent.retired}
        uploads={uploads}
        isUploading={isUploading}
        onPickFiles={handlePickFiles}
      />
    </KeyboardAvoidingView>
  );
}
