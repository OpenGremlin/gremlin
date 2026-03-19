import {
  Code,
  FileAudio,
  File as FileIcon,
  FileText,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { AgentLogsQuery } from "../graphql/generated/graphql";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { Markdown } from "./LogEntryView/Markdown";
import { SheetModal } from "./SheetModal";

type FileNode =
  AgentLogsQuery["agentLogs"]["edges"][number]["node"]["files"][number];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon_({ render }: { render: FileNode["render"] }) {
  const colors = useNavigationTheme();
  const size = 14;

  switch (render.__typename) {
    case "DocumentRender":
      return <FileText size={size} color={colors.accentIndicator} />;
    case "CodeRender":
      return <Code size={size} color={colors.accentIndicator} />;
    case "ImageRender":
      return <ImageIcon size={size} color={colors.accentIndicator} />;
    case "AudioRender":
      return <FileAudio size={size} color={colors.accentIndicator} />;
    case "VideoRender":
      return <FileVideo size={size} color={colors.accentIndicator} />;
    default:
      return <FileIcon size={size} color={colors.accentIndicator} />;
  }
}

function FilePreview({ file }: { file: FileNode }) {
  const { render } = file;

  if (render.__typename === "DocumentRender") {
    return (
      <ScrollView
        className="flex-1 bg-bg px-10 py-4"
        contentContainerClassName="pb-16"
      >
        <Markdown>{render.markdown}</Markdown>
      </ScrollView>
    );
  }

  if (render.__typename === "CodeRender") {
    return (
      <ScrollView
        className="flex-1 bg-bg px-4 py-4"
        contentContainerClassName="pb-16"
        horizontal={false}
      >
        <Text
          className="text-xs text-text-muted mb-2"
          style={{ fontFamily: "monospace" }}
        >
          {render.language}
        </Text>
        <Text
          className="text-sm text-text-primary"
          style={{ fontFamily: "monospace" }}
          selectable
        >
          {render.content}
        </Text>
      </ScrollView>
    );
  }

  if (render.__typename === "ImageRender") {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          Image preview not yet available
        </Text>
        {render.width != null && render.height != null && (
          <Text className="text-text-muted text-xs mt-1">
            {render.width} x {render.height}
          </Text>
        )}
      </View>
    );
  }

  if (
    render.__typename === "AudioRender" ||
    render.__typename === "VideoRender"
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          {render.__typename === "AudioRender" ? "Audio" : "Video"} preview not
          yet available
        </Text>
        {render.durationSeconds != null && (
          <Text className="text-text-muted text-xs mt-1">
            {Math.round(render.durationSeconds)}s
          </Text>
        )}
      </View>
    );
  }

  // UnknownRender
  return (
    <View className="flex-1 items-center justify-center bg-bg p-6">
      <Text className="text-text-muted text-sm">
        Cannot preview this file type
      </Text>
      {"mimeType" in render && render.mimeType && (
        <Text className="text-text-muted text-xs mt-1">{render.mimeType}</Text>
      )}
    </View>
  );
}

function cardSubtitle(file: FileNode): string {
  const parts: string[] = [];
  parts.push(formatFileSize(file.sizeBytes));
  if (file.render.__typename === "CodeRender") {
    parts.push(file.render.language);
  } else if (file.mimeType) {
    parts.push(file.mimeType);
  }
  return parts.join("  ·  ");
}

export function FileCard({ file }: { file: FileNode }) {
  const [open, setOpen] = useState(false);
  const canPreview =
    file.render.__typename === "DocumentRender" ||
    file.render.__typename === "CodeRender";
  const isDocument = file.render.__typename === "DocumentRender";
  const displayTitle =
    isDocument && "title" in file.render
      ? file.render.title || file.name
      : file.name;

  return (
    <>
      <Pressable
        onPress={canPreview ? () => setOpen(true) : undefined}
        className="bg-surface border border-app-border rounded-lg overflow-hidden"
        style={!canPreview ? { opacity: 0.7 } : undefined}
      >
        <View className="flex-row items-center gap-2 px-3 py-2">
          <FileIcon_ render={file.render} />
          {isDocument ? (
            <Text
              className="text-sm font-medium text-text-secondary flex-1"
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
          ) : (
            <View className="flex-1 min-w-0">
              <Text
                className="text-sm font-medium text-text-secondary"
                numberOfLines={1}
              >
                {file.name}
              </Text>
              <Text className="text-[10px] text-text-muted" numberOfLines={1}>
                {cardSubtitle(file)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {canPreview && (
        <SheetModal
          visible={open}
          title={displayTitle}
          onClose={() => setOpen(false)}
        >
          <FilePreview file={file} />
        </SheetModal>
      )}
    </>
  );
}
