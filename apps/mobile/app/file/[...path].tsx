import { useQuery } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  FileQuery,
  TaskQuery,
  WorkspaceEntriesQuery,
} from "../../src/graphql/queries";
import { PostQuery } from "../../src/graphql/queries/posts";
import { EmptyState } from "../../src/shared/EmptyState";
import { FileNotFoundState } from "../../src/shared/FileNotFoundState";
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
import { PickerOverlay } from "../../src/shared/PickerModal";
import { Sheet } from "../../src/shared/Sheet";

/**
 * Unified file route:
 *  /file/{path}              — single file preview
 *  /file/{path}?task={id}    — pager through task's files, starting at this file
 *  /file/{path}?post={id}    — pager through post's files, starting at this file
 *  /file/{path}?dir={path}   — pager through directory siblings, starting at this file
 */
export default function FileScreen() {
  const { path, task, post, dir } = useLocalSearchParams<{
    path: string[];
    task?: string;
    post?: string;
    dir?: string;
  }>();
  const filePath = Array.isArray(path) ? path.join("/") : (path ?? "");
  const isPager = !!task || !!post || dir != null;

  return (
    <>
      {isPager ? (
        <PagerMode
          filePath={filePath}
          taskId={task}
          postId={post}
          dirPath={dir}
        />
      ) : (
        <SingleMode filePath={filePath} />
      )}
      <PickerOverlay />
    </>
  );
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
        <FileNotFoundState fileName={filePath.split("/").pop() ?? ""} />
      ) : (
        <FilePreview render={file.render} filePath={file.path} />
      )}
    </Sheet>
  );
}

function PagerMode({
  filePath,
  taskId,
  postId,
  dirPath,
}: {
  filePath: string;
  taskId?: string;
  postId?: string;
  dirPath?: string;
}) {
  // Task files
  const { data: taskData, loading: taskLoading } = useQuery(TaskQuery, {
    variables: { id: taskId ?? "" },
    skip: !taskId,
  });

  // Post files
  const { data: postData, loading: postLoading } = useQuery(PostQuery, {
    variables: { id: postId ?? "" },
    skip: !postId,
  });

  // Directory files
  const { data: dirData, loading: dirLoading } = useQuery(
    WorkspaceEntriesQuery,
    {
      variables: { path: dirPath ?? "" },
      skip: dirPath == null,
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
    if (postId && postData?.post) {
      const postFiles: (FileNode | PagerFileEntry)[] = filesFromAttachments(
        postData.post.attachments ?? [],
      );
      const idx = postFiles.findIndex((f) => f.path === filePath);
      return { files: postFiles, initialIndex: Math.max(0, idx) };
    }
    if (dirPath != null && dirData?.workspaceEntries) {
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
  }, [taskId, taskData, postId, postData, dirPath, dirData, filePath]);

  const loading = taskLoading || postLoading || dirLoading;

  if (loading) {
    return (
      <Sheet title={filePath.split("/").pop() ?? "File"}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Sheet>
    );
  }

  if (files.length === 0) {
    return (
      <Sheet title={filePath.split("/").pop() ?? "Folder"}>
        <EmptyState
          message="No files"
          description={
            dirPath != null
              ? "This folder doesn't contain any previewable files."
              : undefined
          }
        />
      </Sheet>
    );
  }

  return <FilePagerSheet files={files} initialIndex={initialIndex} />;
}
