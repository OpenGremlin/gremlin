import { ScrollView, Text, View } from "react-native";
import type {
  AttachmentFieldsFragment,
  FileQuery,
} from "../graphql/generated/graphql";
import { FileActions } from "./FileActions";
import { Markdown } from "./LogEntryView/Markdown";
import { AudioPlayer, VideoPlayer } from "./MediaPlayer";
import { PdfViewer } from "./PdfViewer";
import { ZoomableImage } from "./ZoomableImage";

export type FileNode = NonNullable<
  Extract<AttachmentFieldsFragment, { __typename?: "FileAttachment" }>["file"]
>;

/** Extract File objects from an attachments array, skipping missing files. */
export function filesFromAttachments(
  attachments: readonly AttachmentFieldsFragment[],
): FileNode[] {
  return attachments
    .filter(
      (
        a,
      ): a is Extract<
        AttachmentFieldsFragment,
        { __typename?: "FileAttachment" }
      > => a.__typename === "FileAttachment",
    )
    .map((a) => a.file)
    .filter((f): f is FileNode => f != null);
}

/** The file(path) query returns the same shape — reuse it. */
export type FileQueryNode = NonNullable<FileQuery["file"]>;

export function FilePreview({
  render,
  filePath,
  onZoomChange,
}: {
  render: FileNode["render"] | FileQueryNode["render"];
  /** File path in the workspace — enables the Discuss button on documents. */
  filePath?: string;
  /** Forwarded to ZoomableImage for image renders so a pager can disable swipes while zoomed. */
  onZoomChange?: (zoomed: boolean) => void;
}) {
  if (render.__typename === "DocumentRender") {
    return (
      <View className="flex-1 bg-bg">
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerClassName="pb-28"
        >
          <Markdown>{render.markdown}</Markdown>
        </ScrollView>
        {filePath && (
          <FileActions
            filePath={filePath}
            markdown={render.markdown}
            absolute
          />
        )}
      </View>
    );
  }

  if (render.__typename === "CodeRender") {
    return (
      <View className="flex-1 bg-bg">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerClassName="pb-28"
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
        {filePath && (
          <FileActions filePath={filePath} markdown={render.content} absolute />
        )}
      </View>
    );
  }

  if (render.__typename === "PdfRender" && "url" in render) {
    return <PdfViewer url={render.url} />;
  }

  if (render.__typename === "ImageRender") {
    if (render.url) {
      return (
        <View className="flex-1 bg-bg">
          <ZoomableImage
            url={render.url}
            fullUrl={render.fullUrl}
            aspectRatio={render.aspectRatio ?? 1}
            nativeWidth={render.width}
            onZoomChange={onZoomChange}
          />
          {filePath && <FileActions filePath={filePath} absolute />}
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          Image preview not available
        </Text>
      </View>
    );
  }

  if (render.__typename === "AudioRender") {
    if (render.url) {
      return <AudioPlayer url={render.url} title={filePath} />;
    }
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          Audio preview not available
        </Text>
      </View>
    );
  }

  if (render.__typename === "VideoRender") {
    if (render.url) {
      return <VideoPlayer url={render.url} title={filePath} />;
    }
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          Video preview not available
        </Text>
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
