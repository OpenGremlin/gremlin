import { router } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import type { AttachmentFieldsFragment } from "../graphql/generated/graphql";
import { FileCard } from "./FileCard";
import { filesFromAttachments } from "./FilePreview";
import { groupFiles } from "./groupFiles";
import { ImageCollage } from "./ImageCollage";

/**
 * Renders task attachments as an image collage + file cards, identical to the
 * home screen task card layout. Designed to sit below delegate / background
 * task cards in the main lane.
 */
export function TaskAttachments({
  attachments,
  taskId,
}: {
  attachments: readonly AttachmentFieldsFragment[];
  taskId: string;
}) {
  const files = useMemo(() => filesFromAttachments(attachments), [attachments]);
  const groups = useMemo(() => groupFiles(files), [files]);

  if (files.length === 0) return null;

  const openPager = (index: number) => {
    const file = files[index];
    if (file) {
      router.push({
        pathname: "/file/[...path]",
        params: { path: file.path.split("/"), task: taskId },
      });
    }
  };

  return (
    <View className="mt-1.5 gap-1" onStartShouldSetResponder={() => true}>
      {groups.map((group) => {
        if (group.kind === "images") {
          return (
            <ImageCollage
              key={`images-${group.indices[0]}`}
              images={group.files}
              onPressImage={(i) => openPager(group.indices[i])}
            />
          );
        }
        return (
          <FileCard
            key={`${group.file.path}-${group.index}`}
            file={group.file}
            onPress={() => openPager(group.index)}
          />
        );
      })}
    </View>
  );
}
