import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import type { FilePreviewSheetPayload } from "../../src/shared/FileCard";
import { FilePreview } from "../../src/shared/FilePreview";
import { FilePreviewActions } from "../../src/shared/FilePreviewActions";
import { Sheet } from "../../src/shared/Sheet";

export default function FilePreviewSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<FilePreviewSheetPayload>(id);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  return (
    <Sheet
      title={payload.title}
      headerActions={<FilePreviewActions file={payload.file} />}
    >
      <FilePreview render={payload.file.render} />
    </Sheet>
  );
}
