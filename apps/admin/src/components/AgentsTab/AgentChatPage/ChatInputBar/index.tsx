import { ArrowRight, Check, File, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { FileUploadState } from "../../../../hooks/useFileUpload";
import { formatFileSize } from "../../../../hooks/useFileUpload";

function UploadProgressItem({
  upload,
  index,
  onCancel,
}: {
  upload: FileUploadState;
  index: number;
  onCancel: (index: number) => void;
}) {
  const isDone = upload.status === "done";
  const isError = upload.status === "error";
  const isActive =
    upload.status === "uploading" ||
    upload.status === "completing" ||
    upload.status === "pending";

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-neutral-800/50">
      <div className="shrink-0">
        {isDone ? (
          <Check size={14} className="text-green-400" />
        ) : isError ? (
          <X size={14} className="text-red-400" />
        ) : (
          <File size={14} className="text-neutral-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-200 truncate">
            {upload.file.name}
          </span>
          <span className="text-[10px] text-neutral-500 shrink-0">
            {formatFileSize(upload.file.size)}
          </span>
        </div>
        {isActive && (
          <div className="mt-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}
        {isError && upload.error && (
          <span className="text-[10px] text-red-400 mt-0.5 block truncate">
            {upload.error}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {isActive && (
          <>
            <span className="text-[10px] text-neutral-400">
              {upload.status === "completing"
                ? "Finishing..."
                : `${upload.progress}%`}
            </span>
            <button
              type="button"
              onClick={() => onCancel(index)}
              className="p-0.5 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={`Cancel upload of ${upload.file.name}`}
            >
              <X size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  uploads,
  isUploading,
  onFilesSelected,
  onCancelUpload,
  onClearUploads,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  uploads?: FileUploadState[];
  isUploading?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onCancelUpload?: (index: number) => void;
  onClearUploads?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-clear completed uploads after a delay
  useEffect(() => {
    if (!uploads || uploads.length === 0) return;
    const allDone = uploads.every(
      (u) => u.status === "done" || u.status === "error",
    );
    if (!allDone) return;
    const timer = setTimeout(() => {
      onClearUploads?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [uploads, onClearUploads]);

  const isEmpty = !value.trim();
  const hasUploads = uploads && uploads.length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-800/60 bg-neutral-950/70 backdrop-blur-md px-3 py-3.5">
      {/* Upload progress area */}
      {hasUploads && (
        <div className="mb-2 space-y-1 max-h-40 overflow-y-auto">
          {uploads.map((upload, i) => (
            <UploadProgressItem
              key={`${upload.file.name}-${upload.file.size}-${i}`}
              upload={upload}
              index={i}
              onCancel={onCancelUpload ?? (() => {})}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Upload button */}
        {onFilesSelected && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  onFilesSelected(Array.from(files));
                }
                // Reset so the same file can be re-selected
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              aria-label="Attach files"
            >
              {isUploading ? (
                <Loader2 size={16} className="text-neutral-400 animate-spin" />
              ) : (
                <Paperclip size={16} className="text-neutral-400" />
              )}
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-neutral-800 text-sm text-neutral-100 rounded-full px-4 py-2 outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!isEmpty) onSend();
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!isEmpty) onSend();
          }}
          disabled={isEmpty}
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          <ArrowRight size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
