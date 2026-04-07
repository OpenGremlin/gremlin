import {
  Code,
  FileAudio,
  File as FileIcon,
  FileText,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { AuthImage } from "./AuthImage";
import type { FileNode } from "./FilePreview";
import { FilePreview } from "./FilePreview";
import { FilePreviewActions } from "./FilePreviewActions";
import { formatFileSize } from "./formatFileSize";
import { SheetModal } from "./SheetModal";

export type { FileNode } from "./FilePreview";

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

export function FileCard({
  file,
  onPress,
}: {
  file: FileNode;
  /**
   * If provided, replaces the built-in preview-modal behavior. Use this when a
   * parent owns a unified pager (e.g., the home feed) and wants taps routed
   * back to it instead of opening a per-card SheetModal.
   */
  onPress?: () => void;
}) {
  const [open, setOpen] = useState(false);
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
  const useOwnModal = !onPress;
  const handlePress = onPress ?? (() => setOpen(true));

  if (file.render.__typename === "ImageRender" && file.render.url) {
    const { url, aspectRatio } = file.render;
    return (
      <>
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

        {useOwnModal && (
          <SheetModal
            visible={open}
            title={file.name}
            onClose={() => setOpen(false)}
            headerActions={<FilePreviewActions file={file} />}
          >
            <FilePreview render={file.render} />
          </SheetModal>
        )}
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={canPreview ? handlePress : undefined}
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

      {canPreview && useOwnModal && (
        <SheetModal
          visible={open}
          title={displayTitle}
          onClose={() => setOpen(false)}
          headerActions={<FilePreviewActions file={file} />}
        >
          <FilePreview render={file.render} />
        </SheetModal>
      )}
    </>
  );
}
