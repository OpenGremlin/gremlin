import { ScrollView, Text, View } from "react-native";
import type { AgentLogsQuery, FileQuery } from "../graphql/generated/graphql";
import { Markdown } from "./LogEntryView/Markdown";
import { AudioPlayer, VideoPlayer } from "./MediaPlayer";
import { ZoomableImage } from "./ZoomableImage";

export type FileNode =
  AgentLogsQuery["agentLogs"]["edges"][number]["node"]["files"][number];

/** The file(path) query returns the same shape — reuse it. */
export type FileQueryNode = NonNullable<FileQuery["file"]>;

export function FilePreview({
  render,
}: {
  render: FileNode["render"] | FileQueryNode["render"];
}) {
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
    if (render.url) {
      return (
        <View className="flex-1 bg-bg">
          <ZoomableImage
            url={render.url}
            fullUrl={render.fullUrl}
            aspectRatio={render.aspectRatio ?? 1}
            nativeWidth={render.width}
          />
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
      return <AudioPlayer url={render.url} />;
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
      return <VideoPlayer url={render.url} />;
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
