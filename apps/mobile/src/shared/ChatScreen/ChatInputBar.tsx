import { BlurView } from "expo-blur";
import { ArrowUp, Paperclip } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { FileUploadState } from "../../hooks/useFileUpload";
import { haptics } from "../../lib/haptics";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { formatFileSize } from "../formatFileSize";

const UploadProgressItem = React.memo(function UploadProgressItem({ upload }: { upload: FileUploadState }) {
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
          {isDone && <Text className="text-[10px] text-success">Done</Text>}
          {isError && (
            <Text className="text-[10px] text-error" numberOfLines={1}>
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
              className="h-full bg-accent rounded-full"
              style={{ width: `${upload.progress}%` }}
            />
          </View>
        )}
      </View>
    </View>
  );
});

interface ChatInputBarProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  uploads: FileUploadState[];
  isUploading: boolean;
  onPickFiles: () => void;
}

export function ChatInputBar({
  input,
  setInput,
  onSend,
  sending,
  disabled,
  uploads,
  isUploading,
  onPickFiles,
}: ChatInputBarProps) {
  const colors = useNavigationTheme();
  const { isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const isWeb = process.env.EXPO_OS === "web";
  const [webHeight, _setWebHeight] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const hasText = input.trim().length > 0;
  const canSend = hasText && !sending;
  const hasUploads = uploads.length > 0;

  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));
  const handleSend = useCallback(() => {
    haptics.light();
    sendScale.value = withSpring(0.85, { damping: 12, stiffness: 400 }, () => {
      sendScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    // Clear text eagerly so the remounted TextInput starts at minimum height
    setInput("");
    onSend();
    setInputKey((k) => k + 1);
    // Refocus after remount so keyboard stays up
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onSend, sendScale, setInput]);

  if (disabled) {
    return (
      <View className="px-3 py-3.5">
        <Text className="text-sm text-text-muted text-center">
          This agent is retired.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-3 pt-1.5 pb-2">
      {hasUploads && (
        <View className="mb-2 gap-1">
          {uploads.map((upload, i) => (
            <UploadProgressItem key={`${upload.name}-${i}`} upload={upload} />
          ))}
        </View>
      )}

      <View
        className={`flex-row items-end gap-1.5 rounded-3xl pl-1.5 pr-1.5 py-1 overflow-hidden ${isDark ? "border border-white/15" : ""}`}
        style={{ borderCurve: "continuous" }}
      >
        {!isWeb ? (
          <BlurView
            tint={
              isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"
            }
            intensity={85}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        ) : (
          <View
            className="bg-surface"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        )}
        <View style={{ paddingBottom: 2 }}>
          <Pressable
            onPress={onPickFiles}
            disabled={isUploading}
            className={`rounded-full items-center justify-center ${isUploading ? "opacity-50" : "active:bg-surface-alt"}`}
            style={{ width: 30, height: 30 }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.iconMuted} />
            ) : (
              <Paperclip size={16} color={colors.iconMuted} />
            )}
          </Pressable>
        </View>

        <TextInput
          ref={inputRef}
          className="flex-1 text-text-primary text-base leading-[20px] px-1 outline-none relative z-10"
          key={isWeb ? undefined : inputKey}
          style={{
            ...(!isWeb && { minHeight: 34 }),
            ...(isWeb && webHeight > 0 && { height: Math.min(140, webHeight) }),
            maxHeight: 140,
            paddingVertical: 7,
          }}
          value={input}
          onChangeText={setInput}
          onContentSizeChange={undefined}
          placeholder="Message..."
          placeholderTextColor={colors.placeholderText}
          multiline
          {...(isWeb ? { rows: 1 } : {})}
          blurOnSubmit={false}
        />

        {(canSend || sending) && (
          <View style={{ paddingBottom: 2 }}>
            <Animated.View style={sendAnimStyle}>
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                className={`rounded-full items-center justify-center bg-accent ${canSend ? "active:bg-accent-light" : "opacity-50"}`}
                style={{ width: 30, height: 30 }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ArrowUp size={18} color="#fff" />
                )}
              </Pressable>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}
