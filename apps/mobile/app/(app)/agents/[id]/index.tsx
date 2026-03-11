import * as DocumentPicker from "expo-document-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowUp, Paperclip } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AgentQuery, TaskQuery } from "../../../../src/graphql/queries";
import { useChatSend } from "../../../../src/hooks/useChatSend";
import {
  type FileUploadState,
  formatFileSize,
  useFileUpload,
} from "../../../../src/hooks/useFileUpload";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../../../src/hooks/useLogMessages";
import { useQuery } from "../../../../src/hooks/useQuery";
import { useSandboxOutput } from "../../../../src/hooks/useSandboxOutput";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { ChatHeaderTitle } from "../../../../src/shared/ChatHeaderTitle";
import { LogEntryView } from "../../../../src/shared/LogEntryView";
import { PendingMessageBubble } from "../../../../src/shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

function UploadProgressItem({ upload }: { upload: FileUploadState }) {
  const isDone = upload.status === "done";
  const isError = upload.status === "error";
  const isActive =
    upload.status === "uploading" ||
    upload.status === "completing" ||
    upload.status === "pending";

  return (
    <View className="flex-row items-center gap-2 py-1.5 px-2 rounded-lg bg-surface-alt/50">
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-xs text-text-secondary flex-shrink"
            numberOfLines={1}
          >
            {upload.name}
          </Text>
          <Text className="text-[10px] text-text-muted">
            {formatFileSize(upload.size)}
          </Text>
          {isDone && <Text className="text-[10px] text-green-400">Done</Text>}
          {isError && (
            <Text className="text-[10px] text-red-400" numberOfLines={1}>
              {upload.error ?? "Error"}
            </Text>
          )}
          {isActive && (
            <Text className="text-[10px] text-text-muted">
              {upload.status === "completing"
                ? "Finishing..."
                : `${upload.progress}%`}
            </Text>
          )}
        </View>
        {isActive && (
          <View className="mt-1 h-1 bg-surface-alt rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${upload.progress}%` }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function ChatInputBar({
  input,
  setInput,
  onSend,
  disabled,
  uploads,
  isUploading,
  onPickFiles,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  uploads: FileUploadState[];
  isUploading: boolean;
  onPickFiles: () => void;
}) {
  const colors = useNavigationTheme();
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(36);
  const canSend = input.trim().length > 0;
  const hasUploads = uploads.length > 0;

  // Reset height when input is cleared
  useEffect(() => {
    if (input === "") setInputHeight(36);
  }, [input]);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-clear finished uploads after 3 seconds
  // (handled by parent via clearUploads)

  if (disabled) {
    return (
      <View className="border-t border-app-border bg-bg px-3 py-3.5">
        <Text className="text-sm text-text-muted text-center">
          This agent is retired.
        </Text>
      </View>
    );
  }

  return (
    <View className="border-t border-app-border bg-bg px-3 py-2">
      {/* Upload progress area */}
      {hasUploads && (
        <View className="mb-2 gap-1">
          {uploads.map((upload, i) => (
            <UploadProgressItem key={`${upload.name}-${i}`} upload={upload} />
          ))}
        </View>
      )}

      <View className="flex-row items-end gap-2">
        {/* File upload button */}
        <Pressable
          onPress={onPickFiles}
          disabled={isUploading}
          className={`w-8 h-8 rounded-full items-center justify-center mb-0.5 bg-surface-alt ${isUploading ? "opacity-50" : ""}`}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.iconDefault} />
          ) : (
            <Paperclip size={16} color={colors.iconDefault} />
          )}
        </Pressable>

        <TextInput
          ref={inputRef}
          className="flex-1 bg-surface-alt rounded-2xl px-4 py-2 text-text-primary text-sm"
          style={{ height: Math.min(112, Math.max(36, inputHeight)) }}
          value={input}
          onChangeText={setInput}
          onContentSizeChange={(e) =>
            setInputHeight(e.nativeEvent.contentSize.height)
          }
          placeholder="Message..."
          placeholderTextColor={colors.placeholderText}
          multiline
          numberOfLines={1}
          blurOnSubmit={false}
          textAlignVertical="center"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          className={`w-8 h-8 rounded-full items-center justify-center mb-0.5 ${
            canSend ? "bg-blue-600" : "bg-surface-alt"
          }`}
        >
          <ArrowUp size={18} color={canSend ? "#fff" : colors.iconMuted} />
        </Pressable>
      </View>
    </View>
  );
}

export default function AgentChatScreen() {
  const colors = useNavigationTheme();
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
          headerTitle: () => (
            <ChatHeaderTitle
              agentId={id}
              title={agent.name}
              onPress={() => router.push(`/agents/${id}/config`)}
            />
          ),
        }}
      />

      {taskId && task && (
        <View className="px-4 py-2 bg-surface/80 border-b border-app-border">
          <Text className="text-xs text-text-muted">Task</Text>
          <Text className="text-sm text-text-secondary" numberOfLines={1}>
            {task.title ?? task.message}
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
          paddingBottom: 120,
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
