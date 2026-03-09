import { Check, ExternalLink, File, Loader2 } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { formatFileSize } from "../../../../hooks/useFileUpload";
import type { ChatMessage } from "../../../../hooks/useLogMessages";
import type { CommandStream } from "../../../../hooks/useSandboxOutput";
import { DocumentCard } from "../../../../shared/DocumentCard";
import { formatTime } from "../../../../shared/formatDate";
import { RunCommandBlock } from "./RunCommandBlock";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";
import { ToolBlock } from "./ToolBlock";
import { useTaskInfo } from "./useTaskInfo";

function FileUploadCard({
  data,
  onFileClick,
}: {
  data: {
    filename?: string;
    path?: string;
    sizeBytes?: number;
    contentType?: string;
    files?: Array<{
      filename?: string;
      path?: string;
      sizeBytes?: number;
      contentType?: string;
    }>;
  };
  onFileClick?: (path: string) => void;
}) {
  const files = data.files ?? [data];

  return (
    <div className="py-1 space-y-1">
      {files.map((file, i) => {
        const clickable = !!(file.path && onFileClick);
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally "button" when clickable
          <div
            key={file.path ?? i}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable && file.path
                ? () => onFileClick(file.path as string)
                : undefined
            }
            onKeyDown={
              clickable && file.path
                ? (e) => {
                    if (e.key === "Enter") onFileClick(file.path as string);
                  }
                : undefined
            }
            className={`flex items-center gap-2.5 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg ${clickable ? "cursor-pointer hover:border-neutral-700 transition-colors" : ""}`}
          >
            <File size={16} className="text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-neutral-200 block truncate">
                {file.filename ?? "Unknown file"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {file.sizeBytes != null && (
                  <span className="text-[10px] text-neutral-500">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                )}
                {file.contentType && (
                  <span className="text-[10px] text-neutral-500">
                    {file.contentType}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DelegateTaskCard({
  taskId,
  taskTitle,
  onTaskClick,
}: {
  taskId: string | null;
  taskTitle: string;
  onTaskClick?: (taskId: string) => void;
}) {
  const task = useTaskInfo(taskId);
  const [imgError, setImgError] = useState(false);
  const clickable = !!(taskId && onTaskClick);
  const docs = task?.documents ?? [];

  return (
    <div className="py-1 mr-4 sm:mr-12">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally "button" when clickable */}
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable && taskId ? () => onTaskClick(taskId) : undefined}
        onKeyDown={
          clickable && taskId
            ? (e) => {
                if (e.key === "Enter") onTaskClick(taskId);
              }
            : undefined
        }
        style={{
          background: `
            radial-gradient(ellipse 140% 100% at 0% 100%, rgba(79,70,229,0.45) 0%, transparent 50%),
            radial-gradient(ellipse 100% 140% at 100% 0%, rgba(168,85,247,0.3) 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 80% 90%, rgba(56,189,248,0.12) 0%, transparent 50%),
            linear-gradient(140deg, rgb(8,10,28) 0%, rgb(25,8,55) 50%, rgb(40,8,48) 100%)
          `,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(99,102,241,0.08)",
        }}
        className={`@container w-full text-left border border-indigo-500/20 rounded-xl overflow-hidden transition-all ${clickable ? "cursor-pointer hover:border-indigo-400/35 hover:brightness-115" : "opacity-70"}`}
      >
        <div className="flex min-h-[110px]">
          <div className="flex-1 min-w-0 px-3.5 pt-3">
            <span className="text-sm text-indigo-100 font-medium line-clamp-2 leading-snug">
              <span className="font-bold">Task:</span> {taskTitle}
              {clickable && (
                <ExternalLink
                  size={12}
                  className="text-indigo-400 inline ml-1 align-baseline"
                />
              )}
            </span>
            <div className="mt-2 space-y-1.5 max-h-[4.5rem] overflow-hidden relative">
              {task?.messages
                ?.map((msg, origIdx) => ({ msg, origIdx }))
                .reverse()
                .map(({ msg, origIdx }, i) => {
                  const opacity = i === 0 ? 1 : Math.max(0.25, 1 - i * 0.35);
                  return (
                    <div
                      key={origIdx}
                      className="text-xs flex items-start gap-1.5 text-neutral-400"
                      style={{ opacity }}
                    >
                      <Check
                        size={10}
                        className="shrink-0 opacity-40 mt-[3px]"
                      />
                      <span>{msg}</span>
                    </div>
                  );
                })}
              {(!task?.messages || task.messages.length === 0) && (
                <span className="text-xs text-neutral-500">Delegated task</span>
              )}
            </div>
          </div>
          {task?.imageUrl && !imgError && (
            <div className="hidden xs:block shrink-0 p-2.5 pr-5">
              <img
                src={task.imageUrl}
                alt=""
                className="w-[90px] h-[90px] object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>
        {docs.length > 0 && (
          // biome-ignore lint/a11y/noStaticElementInteractions: stop click propagation on document cards
          <div
            className="px-3.5 pb-3 grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {docs.map((doc) => (
              <DocumentCard key={doc.path} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LogEntryView({
  entry,
  onTaskClick,
  onFileClick,
  sending,
  documents,
  sandboxStreams,
  showTimestamp = true,
}: {
  entry: ChatMessage;
  onTaskClick?: (taskId: string) => void;
  onFileClick?: (path: string) => void;
  sending?: boolean;
  documents?: Array<{ path: string; title: string; body?: string | null }>;
  sandboxStreams?: Map<string, CommandStream>;
  showTimestamp?: boolean;
}) {
  switch (entry.role) {
    case "SYSTEM": {
      const parsed = safeParseJson(entry.content);

      // Handle file_upload entries with a dedicated card
      if (parsed?.type === "file_upload") {
        return (
          <FileUploadCard
            data={parsed as Parameters<typeof FileUploadCard>[0]["data"]}
            onFileClick={onFileClick}
          />
        );
      }

      const label = parsed?.type ? String(parsed.type) : "system";
      const display = parsed ? JSON.stringify(parsed, null, 2) : entry.content;

      return (
        <ToolBlock
          id={entry.id}
          label={label}
          content={display}
          createdAt={entry.createdAt}
          showTimestamp={showTimestamp}
          defaultOpen={false}
        />
      );
    }
    case "USER":
      return (
        <div id={entry.id} className="flex justify-end">
          <div className="max-w-[80%]">
            <div
              className={`text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${sending ? "bg-blue-600/70" : "bg-blue-600"}`}
            >
              <Markdown>{entry.content}</Markdown>
            </div>
            {showTimestamp ? (
              <div className="text-[10px] text-neutral-500 mt-0.5 mb-1 text-right pr-1 flex items-center justify-end gap-1">
                {sending && (
                  <Loader2 size={9} className="animate-spin text-blue-400" />
                )}
                {formatTime(entry.createdAt)}
              </div>
            ) : (
              <div className="mb-0.5" />
            )}
          </div>
        </div>
      );
    case "AGENT":
      return (
        <div id={entry.id} className="flex justify-start">
          <div className="max-w-[80%]">
            <div className="bg-neutral-800 text-neutral-100 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <Markdown>{entry.content}</Markdown>
            </div>
            {showTimestamp ? (
              <div className="text-[10px] text-neutral-500 mt-0.5 mb-1 pl-1">
                {formatTime(entry.createdAt)}
              </div>
            ) : (
              <div className="mb-0.5" />
            )}
          </div>
        </div>
      );
    case "TOOL": {
      const tool = resolveToolFields(entry);

      if (
        tool.name === "updateTaskStatus" ||
        tool.name === "updateTaskMessage"
      ) {
        const message = tool.input?.message as string | undefined;
        return (
          <div id={entry.id} className="flex items-start gap-1.5 py-1.5 px-1">
            <span className="text-xs text-neutral-400 italic">
              {message || "Progress update"}
            </span>
          </div>
        );
      }

      if (tool.name === "createDocument" && documents) {
        const docPath = tool.result?.path as string | undefined;
        const doc = docPath
          ? documents.find((d) => d.path === docPath)
          : undefined;
        if (doc) {
          return (
            <div id={entry.id} className="py-1">
              <DocumentCard doc={doc} />
            </div>
          );
        }
      }

      if (tool.name === "delegateTask") {
        return (
          <DelegateTaskCard
            taskId={(tool.result?.taskId as string) ?? null}
            taskTitle={(tool.input?.title as string) ?? "Untitled task"}
            onTaskClick={onTaskClick}
          />
        );
      }

      if (tool.name === "runCommand") {
        return (
          <RunCommandBlock
            entry={entry}
            tool={tool}
            sandboxStreams={sandboxStreams}
            showTimestamp={showTimestamp}
          />
        );
      }

      const inputEmpty = !tool.input || Object.keys(tool.input).length === 0;
      const pending = inputEmpty && !tool.result;

      if (pending) {
        return (
          <ToolBlock
            id={entry.id}
            label={tool.name}
            createdAt={entry.createdAt}
            showTimestamp={showTimestamp}
          >
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-400">
              <Loader2 size={12} className="animate-spin" />
              Running…
            </div>
          </ToolBlock>
        );
      }

      const sections: string[] = [];
      if (!inputEmpty) sections.push(JSON.stringify(tool.input, null, 2));
      if (tool.result) {
        if (sections.length > 0) sections.push("── result ──");
        sections.push(JSON.stringify(tool.result, null, 2));
      }

      return (
        <ToolBlock
          id={entry.id}
          label={tool.name}
          content={sections.join("\n") || entry.content}
          createdAt={entry.createdAt}
          showTimestamp={showTimestamp}
        />
      );
    }
  }
}
