import { useQuery } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  FileQuery,
  TaskQuery,
  WorkspaceEntriesQuery,
} from "../../src/graphql/queries";
import {
  FilePagerSheet,
  type PagerFileEntry,
} from "../../src/shared/FilePagerView";
import type { FileNode } from "../../src/shared/FilePreview";
import {
  FilePreview,
  filesFromAttachments,
} from "../../src/shared/FilePreview";
import { FilePreviewActions } from "../../src/shared/FilePreviewActions";
import { Sheet } from "../../src/shared/Sheet";

/**
 * Unified file route:
 *  /file/{path}              — single file preview
 *  /file/{path}?task={id}    — pager through task's files, starting at this file
 *  /file/{path}?dir={path}   — pager through directory siblings, starting at this file
 */
export default function FileScreen() {
  const { path, task, dir } = useLocalSearchParams<{
    path: string[];
    task?: string;
    dir?: string;
  }>();
  const filePath = Array.isArray(path) ? path.join("/") : (path ?? "");
  const isPager = !!task || !!dir;

  if (isPager) {
    return <PagerMode filePath={filePath} taskId={task} dirPath={dir} />;
  }
  return <SingleMode filePath={filePath} />;
}

function SingleMode({ filePath }: { filePath: string }) {
  const { data, loading, error } = useQuery(FileQuery, {
    variables: { path: filePath },
    skip: !filePath,
  });

  const file = data?.file ?? null;
  const title = file?.name ?? filePath.split("/").pop() ?? "File";

  return (
    <Sheet
      title={title}
      headerActions={file ? <FilePreviewActions file={file} /> : undefined}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error || !file ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-text-muted text-sm">
            Unable to load this file
          </Text>
        </View>
      ) : (
        <FilePreview render={file.render} />
      )}
    </Sheet>
  );
}

function PagerMode({
  filePath,
  taskId,
  dirPath,
}: {
  filePath: string;
  taskId?: string;
  dirPath?: string;
}) {
  // Task files
  const { data: taskData, loading: taskLoading } = useQuery(TaskQuery, {
    variables: { id: taskId ?? "" },
    skip: !taskId,
  });

  // Directory files
  const { data: dirData, loading: dirLoading } = useQuery(
    WorkspaceEntriesQuery,
    {
      variables: { path: dirPath ?? "" },
      skip: !dirPath,
    },
  );

  const { files, initialIndex } = useMemo(() => {
    if (taskId && taskData?.task) {
      const taskFiles: (FileNode | PagerFileEntry)[] = filesFromAttachments(
        taskData.task.attachments ?? [],
      );
      const idx = taskFiles.findIndex((f) => f.path === filePath);
      return { files: taskFiles, initialIndex: Math.max(0, idx) };
    }
    if (dirPath && dirData?.workspaceEntries) {
      const entries = dirData.workspaceEntries
        .filter((e) => !e.isDirectory)
        .map((e): PagerFileEntry => ({ path: e.path, name: e.name }));
      const idx = entries.findIndex((e) => e.path === filePath);
      return { files: entries, initialIndex: Math.max(0, idx) };
    }
    return {
      files: [{ path: filePath, name: filePath.split("/").pop() ?? "" }],
      initialIndex: 0,
    };
  }, [taskId, taskData, dirPath, dirData, filePath]);

  const loading = taskLoading || dirLoading;

  if (loading) {
    return (
      <Sheet title={filePath.split("/").pop() ?? "File"}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Sheet>
    );
  }

  return <FilePagerSheet files={files} initialIndex={initialIndex} />;
}
