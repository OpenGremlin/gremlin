import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { AuthImage } from "./AuthImage";
import type { FileNode } from "./FilePreview";
import { FileTypeIcon } from "./fileTypeAppearance";
import { formatFileSize } from "./formatFileSize";

export type { FileNode } from "./FilePreview";

function cardSubtitle(file: FileNode): string {
  const parts: string[] = [];
  parts.push(formatFileSize(file.sizeBytes));
  if (file.render.__typename === "CodeRender") {
    parts.push(file.render.language);
  } else if (file.render.__typename === "DocumentRender") {
    parts.push("document");
  } else if (file.mimeType) {
    parts.push(file.mimeType);
  }
  return parts.join("  ·  ");
}

export const FileCard = React.memo(function FileCard({
  file,
  onPress,
  showInlineImage = false,
}: {
  file: FileNode;
  /**
   * If provided, replaces the built-in preview-sheet behavior. Use this
   * when a parent owns a unified pager (e.g., the home feed) and wants
   * taps routed back to it instead of opening a per-card preview.
   */
  onPress?: () => void;
  /** When true, render images inline at full width. Otherwise use the
   *  standard filename card treatment. Defaults to false. */
  showInlineImage?: boolean;
}) {
  const canPreview =
    file.render.__typename === "DocumentRender" ||
    file.render.__typename === "CodeRender" ||
    file.render.__typename === "ImageRender" ||
    file.render.__typename === "AudioRender" ||
    file.render.__typename === "VideoRender";
  const isDocument = file.render.__typename === "DocumentRender";
  const displayTitle =
    isDocument && "title" in file.render
      ? file.render.title || file.name
      : file.name;

  const presentPreview = () => {
    const segments = file.path.split("/");
    const dir = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
    router.push({
      pathname: "/file/[...path]",
      params: { path: segments, dir },
    });
  };

  const handlePress = onPress ?? presentPreview;

  if (
    showInlineImage &&
    file.render.__typename === "ImageRender" &&
    file.render.url
  ) {
    const { url, aspectRatio } = file.render;
    return (
      <Pressable onPress={handlePress} className="rounded-lg overflow-hidden">
        <AuthImage
          uri={url}
          style={{
            width: "100%",
            aspectRatio: aspectRatio ?? 1,
            borderRadius: 8,
          }}
          contentFit="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={canPreview ? handlePress : undefined}
      className="bg-surface border border-app-border rounded-lg overflow-hidden"
      style={!canPreview ? { opacity: 0.7 } : undefined}
    >
      <View className="flex-row items-center gap-2 px-3 py-2">
        <FileTypeIcon fileType={file.fileType} size={14} />
        <View className="flex-1 min-w-0">
          <Text
            className="text-sm font-medium text-text-secondary"
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
          <Text className="text-[10px] text-text-muted" numberOfLines={1}>
            {cardSubtitle(file)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
