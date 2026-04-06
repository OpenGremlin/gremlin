import type { ApolloError } from "@apollo/client";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const isWeb = Platform.OS === "web";

// On native (inverted), paddingBottom is the visual top (space for header overlay).
// On web (non-inverted), paddingTop is the visual top.
const flatListContentStyle = isWeb
  ? ({ paddingHorizontal: 16, paddingTop: 200, paddingBottom: 8 } as const)
  : ({ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 200 } as const);

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

  // On web, don't use inverted FlatList (react-native-web's scaleY(-1) hack is
  // buggy and keeps regressing). Instead reverse the data so oldest is first and
  // the newest message naturally sits at the bottom.
  const displayMessages = useMemo(
    () => (isWeb ? [...messages].reverse() : messages),
    [messages],
  );

  const { input, setInput, pendingMessages, listRef, handleSend, sending } =
    useChatSend({ agentId, taskId, messages });

  // On web (non-inverted list), keep the scroll pinned to the bottom.
  // We track whether the user is "at the bottom" and auto-scroll on every
  // content size change and new message until they scroll away.
  const atBottom = useRef(true);
  // Timestamp of the last programmatic scroll so the scroll handler can
  // distinguish our scrolls from user-initiated ones (no timers needed).
  const lastAutoScrollAt = useRef(0);
  const streamingLength = streamingMessage?.content.length ?? 0;

  // When new messages arrive or streaming updates, re-pin to bottom.
  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (!isWeb) return;
    if (messages.length === 0 && !streamingLength) return;
    const hasNew = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;
    if (hasNew || streamingLength > 0) {
      atBottom.current = true;
      lastAutoScrollAt.current = Date.now();
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: hasNew });
      });
    }
  }, [messages.length, streamingLength, listRef]);

  // Scroll to end on every content size change while pinned to bottom.
  // This catches async markdown layout passes that grow content height after
  // the initial scrollToEnd. We pass the raw height as offset — FlatList
  // clamps it to (contentHeight - layoutHeight), which is the true end.
  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      if (!isWeb || !atBottom.current) return;
      lastAutoScrollAt.current = Date.now();
      listRef.current?.scrollToOffset({ offset: h, animated: false });
    },
    [listRef],
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

  const displayRef = useRef(displayMessages);
  displayRef.current = displayMessages;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const data = displayRef.current;
      // Inverted (iOS): index-1 is the newer adjacent message (lower index = newer).
      // Non-inverted web: index+1 is the newer adjacent message (higher index = newer).
      const nextIdx = isWeb ? index + 1 : index - 1;
      const next =
        nextIdx >= 0 && nextIdx < data.length ? data[nextIdx] : undefined;
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

  // On web (non-inverted), detect scroll position for two purposes:
  // 1. Load older messages when near the top
  // 2. Un-pin auto-scroll when user scrolls away from the bottom
  const handleScroll = useCallback(
    (e: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!isWeb) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      if (hasMore && contentOffset.y < 200) {
        loadMore();
      }
      // Only update pin state from user-initiated scrolls. Programmatic
      // scrolls are identified by a recent timestamp.
      if (Date.now() - lastAutoScrollAt.current > 200) {
        const distFromBottom =
          contentSize.height - contentOffset.y - layoutMeasurement.height;
        atBottom.current = distFromBottom < 100;
      }
    },
    [hasMore, loadMore],
  );

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

  // Pending messages and streaming bubble — shown at the "newest" end of the list.
  const pendingBubbles =
    pendingMessages.length > 0 || streamingMessage ? (
      <View>
        {pendingMessages.map((content) => (
          <PendingMessageBubble key={content} content={content} />
        ))}
        {streamingMessage && <StreamingBubble message={streamingMessage} />}
      </View>
    ) : null;

  const loadingSpinner = loadingMore ? (
    <View className="items-center py-3">
      <ActivityIndicator size="small" color={colors.loadingIndicator} />
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={listRef}
        style={isWeb ? { flex: 1 } : undefined}
        data={displayMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted={!isWeb}
        onEndReached={!isWeb && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        onScroll={isWeb ? handleScroll : undefined}
        onContentSizeChange={isWeb ? onContentSizeChange : undefined}
        scrollEventThrottle={isWeb ? 100 : undefined}
        contentContainerStyle={flatListContentStyle}
        // On web, disable windowing so all items stay mounted (the list is
        // small enough that this is fine).
        {...(isWeb && { windowSize: 100 })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
        keyboardShouldPersistTaps="handled"
        // Inverted (iOS): header=bottom (newest), footer=top (oldest).
        // Non-inverted (web): header=top (oldest), footer=bottom (newest).
        ListHeaderComponent={isWeb ? loadingSpinner : pendingBubbles}
        ListFooterComponent={isWeb ? pendingBubbles : loadingSpinner}
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
