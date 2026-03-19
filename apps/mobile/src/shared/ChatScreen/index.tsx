import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatSend } from "../../hooks/useChatSend";
import { useFileUpload } from "../../hooks/useFileUpload";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { hexToTransparent } from "../../lib/color";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { LogEntryView } from "../LogEntryView";
import { NotFound, QueryResult } from "../QueryResult";
import { ChatHeaderTitle } from "./ChatHeaderTitle";
import { ChatInputBar } from "./ChatInputBar";
import { PendingMessageBubble } from "./PendingMessageBubble";

type FileNode = ChatMessage["files"][number];

interface ChatScreenProps {
  agentId: string;
  taskId?: string;
  title: string;
  headerTitlePress: () => void;
  headerRight?: ReactNode;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  notFoundLabel?: string;
  disabled?: boolean;
  taskFiles?: FileNode[];
  sandboxStreams?: Map<string, CommandStream>;
}

export function ChatScreen({
  agentId,
  taskId,
  title,
  headerTitlePress,
  headerRight,
  loading: externalLoading,
  error,
  notFound,
  notFoundLabel,
  disabled,
  taskFiles,
  sandboxStreams,
}: ChatScreenProps) {
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();

  const scope = taskId ? { taskId } : { agentId };
  const {
    messages,
    loading: messagesLoading,
    hasMore,
    loadMore,
    loadingMore,
  } = useLogMessages(scope);

  const { input, setInput, pendingMessages, listRef, handleSend } = useChatSend(
    { agentId, taskId, messages },
  );

  const { uploads, uploadFiles, clearUploads, isUploading } = useFileUpload(
    agentId,
    taskId,
  );

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

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const next = index > 0 ? messages[index - 1] : undefined;
      const show = shouldShowTimestamp(item, next);
      return (
        <LogEntryView
          message={item}
          agentId={agentId}
          showTimestamp={show}
          taskFiles={taskFiles}
          sandboxStreams={sandboxStreams}
        />
      );
    },
    [messages, agentId, taskFiles, sandboxStreams],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (externalLoading || messagesLoading) {
    return <QueryResult loading error={null} />;
  }
  if (error) {
    return <QueryResult loading={false} error={error} />;
  }
  if (notFound) {
    return <NotFound label={notFoundLabel ?? "Not found"} />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
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
          colors={[
            colors.background,
            colors.background,
            hexToTransparent(colors.background),
          ]}
          locations={[0, 0.65, 1]}
          style={{
            paddingTop: Platform.OS === "ios" ? insets.top + 8 : 12,
            paddingBottom: 32,
          }}
        >
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
          <View style={{ alignItems: "center" }}>
            <ChatHeaderTitle
              agentId={agentId}
              title={title}
              onPress={headerTitlePress}
            />
          </View>
          {headerRight && (
            <View
              style={{
                position: "absolute",
                top: Platform.OS === "ios" ? insets.top + 4 : 8,
                right: 12,
                zIndex: 3,
                padding: 8,
              }}
            >
              {headerRight}
            </View>
          )}
        </LinearGradient>
      </View>

      <ChatInputBar
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={disabled}
        uploads={uploads}
        isUploading={isUploading}
        onPickFiles={handlePickFiles}
      />
    </KeyboardAvoidingView>
  );
}
