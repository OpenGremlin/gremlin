import { useCallback, useRef, useState } from "react";
import { gql } from "../auth";
import {
  CompleteFileUploadMutation,
  RequestFileUploadsMutation,
} from "../graphql/queries";
import { clientLogger } from "../logger";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export interface FileUploadState {
  file: File;
  status: "pending" | "uploading" | "completing" | "done" | "error";
  progress: number; // 0-100
  error?: string;
  result?: { path: string; filename: string };
}

interface PresignedUpload {
  uploadId: string;
  presignedUrl: string;
  key: string;
}

interface CompleteResult {
  path: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { formatFileSize };

export function useFileUpload(agentId: string, taskId?: string) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const xhrMapRef = useRef<Map<number, XMLHttpRequest>>(new Map());

  const updateUpload = useCallback(
    (index: number, patch: Partial<FileUploadState>) => {
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, ...patch } : u)),
      );
    },
    [],
  );

  const cancelUpload = useCallback((index: number) => {
    const xhr = xhrMapRef.current.get(index);
    if (xhr) {
      xhr.abort();
      xhrMapRef.current.delete(index);
    }
    setUploads((prev) =>
      prev.map((u, i) =>
        i === index ? { ...u, status: "error", error: "Cancelled" } : u,
      ),
    );
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
    xhrMapRef.current.clear();
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      // Validate file sizes
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        const names = oversized.map((f) => f.name).join(", ");
        clientLogger.warn("Files too large", { names });
        // Still set them as errored so user sees feedback
        const errorStates: FileUploadState[] = oversized.map((file) => ({
          file,
          status: "error" as const,
          progress: 0,
          error: `File exceeds 100 MB limit (${formatFileSize(file.size)})`,
        }));
        const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE);
        if (validFiles.length === 0) {
          setUploads(errorStates);
          return;
        }
        files = validFiles;
        setUploads([
          ...errorStates,
          ...files.map((file) => ({
            file,
            status: "pending" as const,
            progress: 0,
          })),
        ]);
      } else {
        setUploads(
          files.map((file) => ({
            file,
            status: "pending" as const,
            progress: 0,
          })),
        );
      }

      // Request presigned URLs
      let presigned: PresignedUpload[];
      try {
        const result = await gql<{
          requestFileUploads: PresignedUpload[];
        }>(RequestFileUploadsMutation, {
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
              ? {
                  ...u,
                  status: "error",
                  error: "Failed to prepare upload",
                }
              : u,
          ),
        );
        return;
      }

      // Find the offset for valid files (in case some were oversized)
      const offset =
        uploads.length > files.length ? uploads.length - files.length : 0;

      // Upload each file in parallel
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

        // Use XMLHttpRequest for progress tracking
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrMapRef.current.set(idx, xhr);

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                updateUpload(idx, { progress: pct });
              }
            });

            xhr.addEventListener("load", () => {
              xhrMapRef.current.delete(idx);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener("error", () => {
              xhrMapRef.current.delete(idx);
              reject(new Error("Network error during upload"));
            });

            xhr.addEventListener("abort", () => {
              xhrMapRef.current.delete(idx);
              reject(new Error("Upload cancelled"));
            });

            xhr.open("PUT", upload.presignedUrl);
            xhr.setRequestHeader(
              "Content-Type",
              file.type || "application/octet-stream",
            );
            xhr.send(file);
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          updateUpload(idx, { status: "error", error: msg });
          return;
        }

        // Complete the upload
        updateUpload(idx, { status: "completing", progress: 100 });
        try {
          const result = await gql<{
            completeFileUpload: CompleteResult;
          }>(CompleteFileUploadMutation, {
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
    [agentId, taskId, updateUpload, uploads.length],
  );

  const isUploading = uploads.some(
    (u) =>
      u.status === "pending" ||
      u.status === "uploading" ||
      u.status === "completing",
  );

  const hasResults = uploads.length > 0;

  return {
    uploads,
    uploadFiles,
    cancelUpload,
    clearUploads,
    isUploading,
    hasResults,
  };
}
