import type { ApolloError } from "@apollo/client";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAgentStream } from "../../hooks/useAgentStream";
import { useChatSend } from "../../hooks/useChatSend";
import { useFileUpload } from "../../hooks/useFileUpload";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { useSpeechStream } from "../../hooks/useSpeechStream";
import { hexToTransparent } from "../../lib/color";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { LogEntryView } from "../LogEntryView";
import { StreamingBubble } from "../LogEntryView/StreamingBubble";
import { NotFound, QueryResult } from "../QueryResult";
import { ChatHeaderTitle } from "./ChatHeaderTitle";
import { ChatInputBar } from "./ChatInputBar";
import { PendingMessageBubble } from "./PendingMessageBubble";

const flatListContentStyle = {
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 200,
  // react-native-web bug: `inverted` applies scaleY(-1) three times (outer
  // scroll, inner scroll, and each cell wrapper) instead of the expected two.
  // Adding a fourth flip on the content container makes the total even, so
  // cell content renders right-side up. No-op on native (inverted works there).
  ...(Platform.OS === "web" && { transform: [{ scaleY: -1 }] }),
} as const;

const overlayContainerStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 2,
};

interface ChatScreenProps {
  agentId: string;
  taskId?: string;
  title: string;
  headerTitlePress: () => void;
  headerRight?: ReactNode;
  loading: boolean;
  error?: ApolloError | string | null;
  onRetry?: () => void;
  notFound: boolean;
  notFoundLabel?: string;
  disabled?: boolean;
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
  onRetry,
  notFound,
  notFoundLabel,
  disabled,
  sandboxStreams,
}: ChatScreenProps) {
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();

  const { streaming: streamingMessage, dismiss: dismissStream } =
    useAgentStream(agentId, taskId ?? null);

  const scope = taskId ? { taskId } : { agentId };

  // Sentence-streaming TTS — subscribes to speech events for this lane.
  // Reads voiceEnabled internally to avoid re-rendering the chat tree on toggle.
  useSpeechStream(scope);

  const onLogCreated = useCallback(
    (logId: string) => {
      dismissStream(logId);
    },
    [dismissStream],
  );
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadMore,
    loadingMore,
    fetchNewer,
  } = useLogMessages(scope, {
    onLogCreated,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNewer();
    } finally {
      setRefreshing(false);
    }
  }, [fetchNewer]);

  const { input, setInput, pendingMessages, listRef, handleSend, sending } =
    useChatSend({ agentId, taskId, messages });

  // On web, the scaleY(-1) workaround reverses scroll semantics, so the
  // FlatList won't auto-show new items at the bottom like native inverted does.
  // Scroll to the bottom on initial load, new messages, and streaming updates.
  const prevMessageCount = useRef(0);
  const streamingLength = streamingMessage?.content.length ?? 0;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (messages.length === 0 && !streamingLength) return;
    const isInitial = prevMessageCount.current === 0;
    const hasNew = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;
    if (isInitial || hasNew || streamingLength > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: 999999,
          animated: !isInitial,
        });
      });
    }
  }, [messages.length, streamingLength, listRef]);

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

  const pickDocuments = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    uploadFiles(
      result.assets.map((asset) => ({
        name: asset.name,
        size: asset.size ?? 0,
        type: asset.mimeType ?? "application/octet-stream",
        uri: asset.uri,
      })),
    );
  }, [uploadFiles]);

  const pickImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;
    uploadFiles(
      result.assets.map((asset) => ({
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "image",
        size: asset.fileSize ?? 0,
        type: asset.mimeType ?? "image/jpeg",
        uri: asset.uri,
      })),
    );
  }, [uploadFiles]);

  const takePhoto = useCallback(async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) return;
    const result = await ImagePicker.launchCameraAsync();
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    // Save to camera roll — discard the photo if permission is denied
    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    if (!mediaPermission.granted) return;
    await MediaLibrary.saveToLibraryAsync(asset.uri);

    uploadFiles([
      {
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "photo",
        size: asset.fileSize ?? 0,
        type: asset.mimeType ?? "image/jpeg",
        uri: asset.uri,
      },
    ]);
  }, [uploadFiles]);

  const handlePickFiles = useCallback(() => {
    if (Platform.OS === "web") {
      pickDocuments();
      return;
    }

    const options = ["Photo Library", "Take Photo", "Choose File", "Cancel"];
    const cancelIndex = 3;

    const handleOption = (index: number) => {
      if (index === 0) pickImages();
      else if (index === 1) takePhoto();
      else if (index === 2) pickDocuments();
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        handleOption,
      );
    } else {
      Alert.alert("Upload", undefined, [
        { text: "Photo Library", onPress: () => pickImages() },
        { text: "Take Photo", onPress: () => takePhoto() },
        { text: "Choose File", onPress: () => pickDocuments() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [pickDocuments, pickImages, takePhoto]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const next = index > 0 ? messagesRef.current[index - 1] : undefined;
      const show = shouldShowTimestamp(item, next);
      return (
        <LogEntryView
          message={item}
          agentId={agentId}
          showTimestamp={show}
          sandboxStreams={sandboxStreams}
        />
      );
    },
    [agentId, sandboxStreams],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (externalLoading || messagesLoading) {
    return <QueryResult loading error={null} />;
  }

  const combinedError = error || messagesError;
  if (combinedError) {
    return (
      <QueryResult loading={false} error={combinedError} onRetry={onRetry} />
    );
  }
  if (notFound) {
    return <NotFound label={notFoundLabel ?? "Not found"} />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        contentContainerStyle={flatListContentStyle}
        // On web the scaleY(-1) inversion hack causes VirtualizedList spacers
        // to appear as visible gaps. Disable windowing on web so all items
        // stay mounted (the list is small enough that this is fine).
        {...(Platform.OS === "web" && { windowSize: 100 })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-3">
              <ActivityIndicator size="small" color={colors.loadingIndicator} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          pendingMessages.length > 0 || streamingMessage ? (
            <View>
              {pendingMessages.map((content) => (
                <PendingMessageBubble key={content} content={content} />
              ))}
              {streamingMessage && (
                <StreamingBubble message={streamingMessage} />
              )}
            </View>
          ) : null
        }
      />

      <View pointerEvents="box-none" style={overlayContainerStyle}>
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
        sending={sending}
        disabled={disabled}
        uploads={uploads}
        isUploading={isUploading}
        onPickFiles={handlePickFiles}
      />
    </KeyboardAvoidingView>
  );
}
