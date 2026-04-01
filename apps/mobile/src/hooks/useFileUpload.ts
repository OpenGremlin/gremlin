import * as ImageManipulator from "expo-image-manipulator";
import { useCallback, useState } from "react";
import {
  CompleteFileUploadMutation,
  RequestFileUploadsMutation,
} from "../graphql/queries";
import { execute } from "../lib/apolloClient";
import { clientLogger } from "../lib/logger";
import { formatFileSize } from "../shared/formatFileSize";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

/** Convert HEIC/HEIF images to WebP using the platform's native codecs. */
async function maybeConvertHeic(file: UploadableFile): Promise<UploadableFile> {
  if (!HEIC_TYPES.has(file.type.toLowerCase())) return file;

  const result = await ImageManipulator.manipulateAsync(file.uri, [], {
    format: ImageManipulator.SaveFormat.WEBP,
    compress: 0.9,
  });

  // Get actual file size — the presigned URL requires a matching ContentLength
  const res = await fetch(result.uri);
  const blob = await res.blob();

  const ext = file.name.lastIndexOf(".");
  const baseName = ext >= 0 ? file.name.slice(0, ext) : file.name;

  return {
    name: `${baseName}.webp`,
    size: blob.size,
    type: "image/webp",
    uri: result.uri,
  };
}

export interface FileUploadState {
  name: string;
  size: number;
  contentType: string;
  status: "pending" | "uploading" | "completing" | "done" | "error";
  progress: number;
  error?: string;
  result?: { path: string; filename: string };
}

interface PresignedUpload {
  uploadId: string;
  presignedUrl: string;
  key: string;
}

interface UploadableFile {
  name: string;
  size: number;
  type: string;
  uri: string;
}

export function useFileUpload(agentId: string, taskId?: string) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);

  const updateUpload = useCallback(
    (index: number, patch: Partial<FileUploadState>) => {
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, ...patch } : u)),
      );
    },
    [],
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const uploadFiles = useCallback(
    async (files: UploadableFile[]) => {
      // Convert HEIC images to WebP before uploading
      files = await Promise.all(files.map(maybeConvertHeic));

      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        const errorStates: FileUploadState[] = oversized.map((file) => ({
          name: file.name,
          size: file.size,
          contentType: file.type,
          status: "error" as const,
          progress: 0,
          error: `File exceeds 100 MB limit (${formatFileSize(file.size)})`,
        }));
        files = files.filter((f) => f.size <= MAX_FILE_SIZE);
        if (files.length === 0) {
          setUploads(errorStates);
          return;
        }
        setUploads([
          ...errorStates,
          ...files.map((f) => ({
            name: f.name,
            size: f.size,
            contentType: f.type,
            status: "pending" as const,
            progress: 0,
          })),
        ]);
      } else {
        setUploads(
          files.map((f) => ({
            name: f.name,
            size: f.size,
            contentType: f.type,
            status: "pending" as const,
            progress: 0,
          })),
        );
      }

      let presigned: PresignedUpload[];
      try {
        const result = await execute(RequestFileUploadsMutation, {
          agentId,
          taskId: taskId ?? null,
          files: files.map((f) => ({
            filename: f.name,
            contentType: f.type || "application/octet-stream",
            sizeBytes: f.size,
          })),
        });
        presigned = result.requestFileUploads;
      } catch (err) {
        clientLogger.error("Failed to request upload URLs", {
          error: err instanceof Error ? err.message : String(err),
        });
        setUploads((prev) =>
          prev.map((u) =>
            u.status === "pending"
              ? { ...u, status: "error", error: "Failed to prepare upload" }
              : u,
          ),
        );
        return;
      }

      const offset = oversized.length;

      const uploadPromises = files.map(async (file, i) => {
        const idx = offset + i;
        const upload = presigned[i];
        if (!upload) {
          updateUpload(idx, {
            status: "error",
            error: "No presigned URL returned",
          });
          return;
        }

        updateUpload(idx, { status: "uploading", progress: 0 });

        try {
          // On native, use fetch with the file URI
          const response = await fetch(file.uri);
          const blob = await response.blob();

          const uploadRes = await fetch(upload.presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: blob,
          });

          if (!uploadRes.ok) {
            throw new Error(`Upload failed with status ${uploadRes.status}`);
          }
          updateUpload(idx, { progress: 100 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          updateUpload(idx, { status: "error", error: msg });
          return;
        }

        updateUpload(idx, { status: "completing", progress: 100 });
        try {
          const result = await execute(CompleteFileUploadMutation, {
            input: {
              agentId,
              taskId: taskId ?? null,
              key: upload.key,
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            },
          });
          updateUpload(idx, {
            status: "done",
            progress: 100,
            result: {
              path: result.completeFileUpload.path,
              filename: result.completeFileUpload.filename,
            },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          clientLogger.error("Failed to complete upload", {
            error: msg,
            filename: file.name,
          });
          updateUpload(idx, { status: "error", error: msg });
        }
      });

      await Promise.allSettled(uploadPromises);
    },
    [agentId, taskId, updateUpload],
  );

  const isUploading = uploads.some(
    (u) =>
      u.status === "pending" ||
      u.status === "uploading" ||
      u.status === "completing",
  );

  return {
    uploads,
    uploadFiles,
    clearUploads,
    isUploading,
  };
}
