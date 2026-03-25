import { ArrowUp, Paperclip } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type { FileUploadState } from "../../hooks/useFileUpload";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { formatFileSize } from "../formatFileSize";

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
}

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
  const inputRef = useRef<TextInput>(null);
  const baseHeight = useRef(0);
  const [inputHeight, setInputHeight] = useState(0);
  const hasText = input.trim().length > 0;
  const canSend = hasText && !sending;
  const hasUploads = uploads.length > 0;

  useEffect(() => {
    if (input === "") setInputHeight(baseHeight.current);
  }, [input]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

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

      <View className="flex-row gap-1.5 bg-surface border border-app-border rounded-3xl pl-1.5 pr-1.5 py-1">
        <View style={{ justifyContent: "flex-end", paddingBottom: 2 }}>
          <Pressable
            onPress={onPickFiles}
            disabled={isUploading}
            className={`rounded-full items-center justify-center ${isUploading ? "opacity-50" : "active:bg-surface-alt"}`}
            style={{ width: 34, height: 34 }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.iconMuted} />
            ) : (
              <Paperclip size={17} color={colors.iconMuted} />
            )}
          </Pressable>
        </View>

        <TextInput
          ref={inputRef}
          className="flex-1 text-text-primary text-base leading-[20px] px-1 py-1.5 outline-none"
          style={
            inputHeight > 0 ? { height: Math.min(140, inputHeight) } : undefined
          }
          value={input}
          onChangeText={setInput}
          onContentSizeChange={(e) => {
            const h = e.nativeEvent.contentSize.height;
            if (baseHeight.current === 0) baseHeight.current = h;
            setInputHeight(h);
          }}
          placeholder="Message..."
          placeholderTextColor={colors.placeholderText}
          multiline
          numberOfLines={1}
          blurOnSubmit={false}
        />

        {(canSend || sending) && (
          <View style={{ justifyContent: "flex-end", paddingBottom: 2 }}>
            <Pressable
              onPress={onSend}
              disabled={!canSend}
              className={`rounded-full items-center justify-center bg-accent ${canSend ? "active:bg-accent-light" : "opacity-50"}`}
              style={{ width: 34, height: 34 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ArrowUp size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
