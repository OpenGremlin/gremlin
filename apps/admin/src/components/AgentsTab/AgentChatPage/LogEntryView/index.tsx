import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Code,
  ExternalLink,
  Loader2,
  Pause,
  XCircle,
} from "lucide-react";
import { DocumentCard } from "../../../../shared/DocumentCard";
import { formatTime } from "../../../../shared/formatDate";
import type { ChatMessage } from "../useChatMessages";
import { useTaskStatus } from "./useTaskStatus";

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

function CollapsibleBlock({
  id,
  label,
  content,
  createdAt,
  textClass = "text-green-400/90",
}: {
  id: string;
  label: string;
  content: string;
  createdAt: string;
  textClass?: string;
}) {
  return (
    <details id={id} className="py-1 group">
      <summary className="list-none cursor-pointer">
        <div className="flex items-center gap-1.5 py-1">
          <ChevronRight
            size={12}
            className="text-neutral-600 shrink-0 transition-transform group-open:rotate-90"
          />
          <span className="text-[11px] text-neutral-500 font-mono">
            {label}
          </span>
          <span className="text-[10px] text-neutral-600">
            {formatTime(createdAt)}
          </span>
        </div>
        <div className="hidden group-open:block bg-neutral-950 border border-neutral-800 rounded-lg mb-1">
          <pre
            className={`text-xs font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed ${textClass}`}
          >
            {content}
          </pre>
        </div>
      </summary>
    </details>
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

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "WAITING"]);

function StatusIcon({ status, active }: { status: string; active: boolean }) {
  if (active)
    return <Loader2 size={12} className="animate-spin shrink-0 text-blue-400" />;
  if (status === "COMPLETED")
    return <CheckCircle size={12} className="text-green-400 shrink-0" />;
  if (status === "FAILED")
    return <XCircle size={12} className="text-red-400 shrink-0" />;
  if (status === "ABANDONED")
    return <AlertCircle size={12} className="text-neutral-400 shrink-0" />;
  if (status === "WAITING")
    return <Pause size={12} className="text-amber-400 shrink-0" />;
  return <CheckCircle size={12} className="text-neutral-600 shrink-0" />;
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
  const task = useTaskStatus(taskId);
  const [imgError, setImgError] = useState(false);
  const clickable = !!(taskId && onTaskClick);
  const statuses = task?.statuses ?? [];
  const current = statuses[statuses.length - 1];
  const isActive = current ? ACTIVE_STATUSES.has(current.status) : false;

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
              {[...statuses].reverse().map((s, i) => {
                const isLast = i === 0;
                const active = isLast && ACTIVE_STATUSES.has(s.status);
                return (
                  <div
                    key={`${s.status}-${i}`}
                    className={`text-xs flex items-center gap-1.5 ${isLast ? "text-neutral-400" : "text-neutral-500"}`}
                  >
                    <StatusIcon status={s.status} active={active} />
                    <span>{s.message || s.status}</span>
                  </div>
                );
              })}
              {statuses.length === 0 && (
                <span className="text-xs text-neutral-500">Delegated task</span>
              )}
              {statuses.length > 2 && (
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
}: {
  entry: ChatMessage;
  onTaskClick?: (taskId: string) => void;
  isLast?: boolean;
  sending?: boolean;
  documents?: Array<{ id: string; title: string; body: string; createdAt?: string; updatedAt: string }>;
}) {
  switch (entry.role) {
    case "SYSTEM": {
      const parsed = safeParseJson(entry.content);
      const label = parsed?.type ? String(parsed.type) : "system";
      const display = parsed
        ? JSON.stringify(parsed, null, 2)
        : entry.content;

      return (
        <CollapsibleBlock
          id={entry.id}
          label={label}
          content={display}
          createdAt={entry.createdAt}
        />
      );
    }
    case "USER":
      return (
        <div id={entry.id} className="flex justify-end py-1">
          <div className="max-w-[80%]">
            <div
              className={`text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md ${sending ? "bg-blue-600/70" : "bg-blue-600"}`}
            >
              {entry.content}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 text-right pr-1 flex items-center justify-end gap-1">
              {sending && (
                <Loader2 size={9} className="animate-spin text-blue-400" />
              )}
              {formatTime(entry.createdAt)}
            </div>
          </div>
        </div>
      );
    case "AGENT":
      return (
        <div id={entry.id} className="flex justify-start py-1">
          <div className="max-w-[80%]">
            <div className="bg-neutral-800 text-neutral-100 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md">
              {entry.content}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 pl-1">
              {formatTime(entry.createdAt)}
            </div>
          </div>
        </div>
      );
    case "TOOL": {
      const tool = resolveToolFields(entry);

      if (tool.name === "updateTaskStatus") {
        const status = tool.input?.status as string | undefined;
        const message = tool.input?.message as string | undefined;
        const isActive =
          (status === "RUNNING" || status === "WAITING") && isLast;
        const StatusIcon =
          status === "COMPLETED"
            ? CheckCircle
            : status === "FAILED"
              ? XCircle
              : status === "ABANDONED"
                ? AlertCircle
                : status === "WAITING" && !isLast
                  ? Pause
                  : isActive
                    ? Loader2
                    : CheckCircle;
        const iconClass =
          status === "COMPLETED"
            ? "text-green-500"
            : status === "FAILED"
              ? "text-red-400"
              : status === "ABANDONED"
                ? "text-neutral-400"
                : status === "WAITING" && !isLast
                  ? "text-amber-400"
                  : isActive
                    ? "text-blue-400 animate-spin"
                    : "text-green-500";

        return (
          <div id={entry.id} className="flex items-start gap-1.5 py-1.5 px-1">
            <StatusIcon size={14} className={`shrink-0 mt-0.5 ${iconClass}`} />
            <span className="text-xs text-neutral-400 italic">
              {message || status || "Status update"}
            </span>
          </div>
        );
      }

      if (tool.name === "createDocument" && documents) {
        const docId = tool.result?.id as string | undefined;
        const doc = docId ? documents.find((d) => d.id === docId) : undefined;
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

      const formattedInput = tool.input
        ? JSON.stringify(tool.input, null, 2)
        : entry.content;

      return (
        <CollapsibleBlock
          id={entry.id}
          label={tool.name}
          content={formattedInput}
          createdAt={entry.createdAt}
        />
      );
    }
  }
}
