import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { CommandStream } from "../../../../hooks/useSandboxOutput";
import { DocumentCard } from "../../../../shared/DocumentCard";
import { formatTime } from "../../../../shared/formatDate";
import type { ChatMessage } from "../../../../hooks/useLogMessages";
import { SandboxOutputBlock } from "./SandboxOutputBlock";
import { useTaskInfo } from "./useTaskInfo";

function safeParseJson(
  s: string | null | undefined,
): Record<string, unknown> | null {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function ScrolledPre({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLPreElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    updateEdges();
  }, [children, updateEdges]);

  return (
    <div className="relative">
      {edges.top && <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-neutral-950/80 to-transparent pointer-events-none z-10 rounded-t-lg" />}
      {edges.bottom && <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none z-10 rounded-b-lg" />}
      <pre ref={ref} className={className} style={style} onScroll={updateEdges}>{children}</pre>
    </div>
  );
}

const BODY_MAX_HEIGHT = `${3 * 1.5 + 1}em`;

function ToolBlock({
  id,
  label,
  content,
  createdAt,
  textClass = "text-green-400/90",
  defaultOpen = true,
  showTimestamp = true,
  badges,
  children,
}: {
  id: string;
  label: React.ReactNode;
  content?: string;
  createdAt: string;
  textClass?: string;
  defaultOpen?: boolean;
  showTimestamp?: boolean;
  badges?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div id={id} className="py-1">
      <details className="group" open={defaultOpen || undefined}>
        <summary className="list-none cursor-pointer">
          <div className="flex items-start gap-1.5 py-1">
            <ChevronRight
              size={12}
              className="text-neutral-300 shrink-0 transition-transform group-open:rotate-90"
            />
            <span className="text-[11px] text-neutral-300 font-bold font-mono">
              {label}
            </span>
            {badges}
            {showTimestamp && (
              <span className="text-[10px] text-neutral-600 shrink-0">
                {formatTime(createdAt)}
              </span>
            )}
          </div>
        </summary>
        {children ?? (
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-lg mb-1">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="absolute top-1.5 right-1.5 p-0.5 text-neutral-600 hover:text-neutral-300 transition-colors z-20"
            >
              {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
            <ScrolledPre
              className={`text-xs font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed overflow-y-auto ${textClass}`}
              style={expanded ? undefined : { maxHeight: BODY_MAX_HEIGHT }}
            >
              {content}
            </ScrolledPre>
          </div>
        )}
      </details>
    </div>
  );
}

/** Normalize tool fields — handles both typed columns and legacy JSON-in-content */
function resolveToolFields(entry: ChatMessage) {
  if (entry.toolName) {
    return {
      name: entry.toolName,
      input: safeParseJson(entry.toolInput),
      result: safeParseJson(entry.toolResult),
    };
  }
  // Legacy: tool data was JSON-stringified into content
  const parsed = safeParseJson(entry.content);
  if (parsed?.name) {
    return {
      name: parsed.name as string,
      input: (parsed.input as Record<string, unknown>) ?? null,
      result: (parsed.result as Record<string, unknown>) ?? null,
    };
  }
  return { name: "tool", input: null, result: null };
}

function DelegateTaskCard({
  id,
  taskId,
  taskTitle,
  createdAt,
  onTaskClick,
}: {
  id: string;
  taskId: string | null;
  taskTitle: string;
  createdAt: string;
  onTaskClick?: (taskId: string) => void;
}) {
  const task = useTaskInfo(taskId);
  const [imgError, setImgError] = useState(false);
  const clickable = !!(taskId && onTaskClick);

  return (
    <div id={id} className="py-1">
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
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(99,102,241,0.08)",
        }}
        className={`w-full text-left border border-indigo-500/20 rounded-xl overflow-hidden transition-all ${clickable ? "cursor-pointer hover:border-indigo-400/35 hover:brightness-115" : "opacity-70"}`}
      >
        <div className="flex h-[110px]">
          <div className="flex-1 min-w-0 px-3.5 py-3">
            <span className="text-sm text-indigo-100 font-medium line-clamp-2 leading-snug">
              {taskTitle}
              {clickable && (
                <ExternalLink size={12} className="text-indigo-400 inline ml-1 align-baseline" />
              )}
            </span>
            <div className="mt-2 space-y-1.5 max-h-[4.5rem] overflow-hidden relative">
              {task?.messages && [...task.messages].reverse().map((msg, i) => (
                <div
                  key={`${msg}-${i}`}
                  className={`text-xs flex items-center gap-1.5 ${i === 0 ? "text-neutral-400" : "text-neutral-500"}`}
                >
                  <Check size={10} className="shrink-0 opacity-40" />
                  <span>{msg}</span>
                </div>
              ))}
              {(!task?.messages || task.messages.length === 0) && (
                <span className="text-xs text-neutral-500">Delegated task</span>
              )}
              {task?.messages && task.messages.length > 2 && (
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-indigo-950 to-transparent pointer-events-none" />
              )}
            </div>
          </div>
          {task?.imageUrl && !imgError && (
            <div className="shrink-0 p-2.5">
              <img
                src={task.imageUrl}
                alt=""
                className="w-[90px] h-[90px] object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogEntryView({
  entry,
  onTaskClick,
  isLast,
  sending,
  documents,
  sandboxStreams,
  showTimestamp = true,
}: {
  entry: ChatMessage;
  onTaskClick?: (taskId: string) => void;
  isLast?: boolean;
  sending?: boolean;
  documents?: Array<{ path: string; title: string; body?: string | null }>;
  sandboxStreams?: Map<string, CommandStream>;
  showTimestamp?: boolean;
}) {
  switch (entry.role) {
    case "SYSTEM": {
      const parsed = safeParseJson(entry.content);
      const label = parsed?.type ? String(parsed.type) : "system";
      const display = parsed
        ? JSON.stringify(parsed, null, 2)
        : entry.content;

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
              className={`text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md ${sending ? "bg-blue-600/70" : "bg-blue-600"}`}
            >
              {entry.content}
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
            <div className="bg-neutral-800 text-neutral-100 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md">
              {entry.content}
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

      if (tool.name === "updateTaskStatus" || tool.name === "updateTaskMessage") {
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
        const doc = docPath ? documents.find((d) => d.path === docPath) : undefined;
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
            id={entry.id}
            taskId={(tool.result?.taskId as string) ?? null}
            taskTitle={(tool.input?.title as string) ?? "Untitled task"}
            createdAt={entry.createdAt}
            onTaskClick={onTaskClick}
          />
        );
      }

      if (tool.name === "runCommand") {
        const commandId = (tool.result?.commandId ?? tool.input?.commandId) as string | undefined;
        const command = tool.input?.command as string | undefined;
        const hasResult = !!tool.result;
        const output = (tool.result?.output as string) ?? "";
        const exitCode = tool.result?.exitCode as number | undefined;

        // Match stream: by commandId if available, otherwise use the latest active stream
        let stream = commandId ? sandboxStreams?.get(commandId) : undefined;
        if (!hasResult && !stream && sandboxStreams) {
          for (const [, s] of sandboxStreams) {
            if (!s.done) stream = s;
          }
        }
        const isStreaming = !hasResult && stream && !stream.done;

        if (!hasResult) {
          return (
            <ToolBlock
              id={entry.id}
              label={<>runCommand(<span className="font-normal text-neutral-400 break-all">$ {command ?? "…"}</span>)</>}
              content=""
              createdAt={entry.createdAt}
              showTimestamp={showTimestamp}
              badges={<>
                {isStreaming && <Loader2 size={10} className="animate-spin text-neutral-500" />}
              </>}
            >
              <SandboxOutputBlock commandId={commandId ?? "pending"} stream={stream} />
            </ToolBlock>
          );
        }

        return (
          <ToolBlock
            id={entry.id}
            label={<>runCommand(<span className="font-normal text-neutral-400 break-all">$ {command ?? "…"}</span>){exitCode !== undefined && exitCode !== 0 && <span className="font-normal text-red-400/70 text-[10px] ml-1">exit {exitCode}</span>}</>}
            content={output || "(no output)"}
            createdAt={entry.createdAt}
            showTimestamp={showTimestamp}
          />
        );
      }

      const sections: string[] = [];
      if (tool.input) sections.push(JSON.stringify(tool.input, null, 2));
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
