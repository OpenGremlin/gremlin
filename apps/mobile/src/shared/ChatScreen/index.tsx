import { type ApolloError, useMutation } from "@apollo/client";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowDown, ChevronLeft, EllipsisVertical } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClearAgentLogMutation } from "../../graphql/queries";
import { useAgentStream } from "../../hooks/useAgentStream";
import { useBubbleLongPress } from "../../hooks/useBubbleLongPress";
import { useChatSend } from "../../hooks/useChatSend";
import { useFilePickers } from "../../hooks/useFilePickers";
import { useFileUpload } from "../../hooks/useFileUpload";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { useSpeechStream } from "../../hooks/useSpeechStream";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { hexToTransparent } from "../../lib/color";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { LogEntryView } from "../LogEntryView";
import { StreamingBubble } from "../LogEntryView/StreamingBubble";
import { NotFound, QueryResult } from "../QueryResult";
import { ChatHeaderTitle } from "./ChatHeaderTitle";
import { ChatInputBar } from "./ChatInputBar";
import { PendingMessageBubble } from "./PendingMessageBubble";

const isWeb = process.env.EXPO_OS === "web";

// Reserve space at the visual bottom of the message list for the floating
// input capsule and the tab bar, so the newest message isn't hidden under
// them while older messages can still scroll behind the blurred chrome.
const INPUT_BAR_HEIGHT = 60;

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
  const { isDark } = useTheme();
  const tabBarHeight = useTabBarHeight();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;
  // When the keyboard is up the tab bar is hidden behind it; only reserve
  // space for the input bar in that case.
  const bottomChromeHeight =
    INPUT_BAR_HEIGHT + (keyboardVisible ? keyboardHeight : tabBarHeight);
  // On native the list is inverted, so paddingTop is the *visual* bottom
  // (where newest messages sit). Reserve enough space for the floating
  // input capsule (and tab bar, when visible) so the newest message isn't
  // hidden under them while older content can still scroll behind them.
  const flatListContentStyle = useMemo(
    () =>
      isWeb
        ? {
            paddingHorizontal: 16,
            paddingTop: 200,
            paddingBottom: 8 + bottomChromeHeight,
          }
        : {
            paddingHorizontal: 16,
            paddingTop: 8 + bottomChromeHeight,
            paddingBottom: 200,
          },
    [bottomChromeHeight],
  );
  useEffect(() => {
    const show = Keyboard.addListener(
      process.env.EXPO_OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      process.env.EXPO_OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const {
    streaming: streamingMessage,
    lastReasoning,
    dismiss: dismissStream,
  } = useAgentStream(agentId, taskId ?? null);

  const scope = useMemo(
    () => (taskId ? { taskId } : { agentId }),
    [taskId, agentId],
  );

  // Sentence-streaming TTS — subscribes to speech events for this lane.
  // Reads voiceEnabled internally to avoid re-rendering the chat tree on toggle.
  useSpeechStream(scope);

  // Long-press menu for agent bubbles (copy + optional TTS)
  const { handleLongPress: onBubbleLongPress } = useBubbleLongPress(agentId);

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
    refetch,
    fetchNewer,
  } = useLogMessages(scope, {
    onLogCreated,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // On web, don't use inverted FlatList (react-native-web's scaleY(-1) hack is
  // buggy and keeps regressing). Instead reverse the data so oldest is first and
  // the newest message naturally sits at the bottom.
  const displayMessages = useMemo(
    () => (isWeb ? [...messages].reverse() : messages),
    [messages],
  );

  const { input, setInput, pendingMessages, listRef, handleSend, sending } =
    useChatSend({ agentId, taskId, messages });

  const [clearAgentLog] = useMutation(ClearAgentLogMutation);

  const handleClearChat = useCallback(() => {
    const doClear = () => {
      clearAgentLog({ variables: { agentId, taskId } })
        .then(() => refetch())
        .catch(() => Alert.alert("Error", "Failed to clear chat"));
    };
    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Clear Chat", "Cancel"],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (index) => {
          if (index === 0) doClear();
        },
      );
    } else {
      Alert.alert("Clear Chat", "This will clear the visible chat history.", [
        { text: "Clear", style: "destructive", onPress: doClear },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [agentId, taskId, clearAgentLog, refetch]);

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

  const { handlePickFiles } = useFilePickers(agentId, uploadFiles);

  const displayRef = useRef(displayMessages);
  displayRef.current = displayMessages;
  const lastReasoningRef = useRef(lastReasoning);
  lastReasoningRef.current = lastReasoning;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const data = displayRef.current;
      const lr = lastReasoningRef.current;
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
          onBubbleLongPress={onBubbleLongPress}
          reasoning={lr?.logId === item.id ? lr : undefined}
        />
      );
    },
    [agentId, sandboxStreams, onBubbleLongPress],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const [showScrollDown, setShowScrollDown] = useState(false);

  // Trigger hard reload when the user overscrolls past the newest end.
  // In inverted mode, contentOffset.y < 0 means pulling past index 0.
  const refreshTriggered = useRef(false);
  const handleScroll = useCallback(
    (e: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

      if (isWeb) {
        if (hasMore && contentOffset.y < 200) {
          loadMore();
        }
        if (Date.now() - lastAutoScrollAt.current > 200) {
          const distFromBottom =
            contentSize.height - contentOffset.y - layoutMeasurement.height;
          atBottom.current = distFromBottom < 100;
        }
      } else {
        setShowScrollDown(contentOffset.y > 300);
        if (contentOffset.y < -80 && !refreshTriggered.current && !refreshing) {
          refreshTriggered.current = true;
          onRefresh().finally(() => {
            refreshTriggered.current = false;
          });
        }
      }
    },
    [hasMore, loadMore, refreshing, onRefresh],
  );

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [listRef]);

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

  // Pending messages, streaming bubble, and refresh spinner — shown at the
  // "newest" end of the list (ListHeaderComponent in inverted mode).
  const pendingBubbles = (
    <View>
      {refreshing && (
        <View className="items-center py-3">
          <ActivityIndicator size="small" color={colors.loadingIndicator} />
        </View>
      )}
      {pendingMessages.map((content) => (
        <PendingMessageBubble key={content} content={content} />
      ))}
      {streamingMessage && <StreamingBubble message={streamingMessage} />}
    </View>
  );

  const loadingSpinner = loadingMore ? (
    <View className="items-center py-3">
      <ActivityIndicator size="small" color={colors.loadingIndicator} />
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        ref={listRef}
        style={isWeb ? { flex: 1 } : undefined}
        data={displayMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={lastReasoning?.logId}
        inverted={!isWeb}
        onEndReached={!isWeb && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        onScroll={handleScroll}
        onContentSizeChange={isWeb ? onContentSizeChange : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={flatListContentStyle}
        maintainVisibleContentPosition={
          !isWeb
            ? { minIndexForVisible: 0, autoscrollToTopThreshold: 200 }
            : undefined
        }
        // On web, disable windowing so all items stay mounted (the list is
        // small enough that this is fine).
        {...(isWeb && { windowSize: 100 })}
        keyboardShouldPersistTaps="handled"
        // Inverted (iOS): header=bottom (newest), footer=top (oldest).
        // Non-inverted (web): header=top (oldest), footer=bottom (newest).
        ListHeaderComponent={isWeb ? loadingSpinner : pendingBubbles}
        ListFooterComponent={isWeb ? pendingBubbles : loadingSpinner}
      />

      {!isWeb && showScrollDown && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={{
            position: "absolute",
            alignSelf: "center",
            bottom: bottomChromeHeight + 16,
            zIndex: 3,
          }}
        >
          <Pressable
            onPress={scrollToBottom}
            className="bg-surface border border-app-border rounded-full items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderCurve: "continuous",
            }}
          >
            <ArrowDown size={18} color={colors.accent} />
          </Pressable>
        </Animated.View>
      )}

      <View pointerEvents="box-none" style={overlayContainerStyle}>
        <View
          style={{
            paddingTop: process.env.EXPO_OS === "ios" ? insets.top + 8 : 12,
            paddingBottom: 32,
          }}
        >
          {process.env.EXPO_OS !== "web" ? (
            <MaskedView
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
              maskElement={
                <LinearGradient
                  colors={["black", "black", "transparent"]}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
              }
            >
              <BlurView
                tint={
                  isDark
                    ? "systemChromeMaterialDark"
                    : "systemChromeMaterialLight"
                }
                intensity={90}
                style={StyleSheet.absoluteFillObject}
              />
            </MaskedView>
          ) : (
            <LinearGradient
              colors={[colors.background, hexToTransparent(colors.background)]}
              locations={[0, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
          )}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: process.env.EXPO_OS === "ios" ? insets.top + 4 : 8,
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
          <View
            style={{
              position: "absolute",
              top: process.env.EXPO_OS === "ios" ? insets.top + 4 : 8,
              right: 12,
              zIndex: 3,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Pressable onPress={handleClearChat} style={{ padding: 8 }}>
              <EllipsisVertical size={22} color={colors.headerText} />
            </Pressable>
            {headerRight}
          </View>
        </View>
      </View>

      {isWeb ? (
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
      ) : (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: keyboardVisible ? keyboardHeight : tabBarHeight,
            zIndex: 1,
          }}
        >
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
        </View>
      )}
    </View>
  );
}
