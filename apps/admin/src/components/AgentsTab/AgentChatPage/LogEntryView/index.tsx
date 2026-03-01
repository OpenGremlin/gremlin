import { CheckCircle, Code, ExternalLink, Loader2 } from "lucide-react";
import type { ChatMessage } from "../useChatMessages";
import { useTaskStatus } from "./useTaskStatus";

function safeParseJson(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "WAITING"]);

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
  const clickable = !!(taskId && onTaskClick);
  const active = task ? ACTIVE_STATUSES.has(task.status) : false;

  return (
    <div id={id} className="py-1 px-2">
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={() => clickable && onTaskClick(taskId!)}
        onKeyDown={(e) =>
          clickable && e.key === "Enter" && onTaskClick(taskId!)
        }
        className={`w-full text-left bg-indigo-950/40 border border-indigo-800/50 rounded-lg px-3 py-2.5 transition-colors ${clickable ? "cursor-pointer hover:border-indigo-600/60" : "opacity-70"}`}
      >
        <div className="flex items-center gap-2">
          <ExternalLink size={14} className="text-indigo-400 shrink-0" />
          <span className="text-sm text-indigo-200 font-medium flex-1 truncate">
            {taskTitle}
          </span>
          <span className="text-[10px] text-neutral-600">
            {formatTime(createdAt)}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1 ml-[22px] flex items-center gap-1.5">
          {active ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              {task?.message || "Working..."}
            </>
          ) : task?.status === "COMPLETED" ? (
            <>
              <CheckCircle size={10} className="text-green-500" />
              {task.message || "Completed"}
            </>
          ) : (
            task?.message || "Delegated task"
          )}
        </p>
      </div>
    </div>
  );
}

export function LogEntryView({
  entry,
  onTaskClick,
}: {
  entry: ChatMessage;
  onTaskClick?: (taskId: string) => void;
}) {
  switch (entry.role) {
    case "SYSTEM":
      return (
        <div id={entry.id} className="flex justify-center py-2">
          <span className="text-xs text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full">
            {entry.content} · {formatTime(entry.createdAt)}
          </span>
        </div>
      );
    case "USER":
      return (
        <div id={entry.id} className="flex justify-end py-1">
          <div className="max-w-[80%]">
            <div className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md">
              {entry.content}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 text-right pr-1">
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
        <div id={entry.id} className="py-1 px-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/50">
              <Code size={12} className="text-neutral-500 shrink-0" />
              <span className="text-[11px] text-neutral-400 font-mono">
                {tool.name}
              </span>
              <span className="text-[10px] text-neutral-600 ml-auto">
                {formatTime(entry.createdAt)}
              </span>
            </div>
            <pre className="text-xs text-green-400/90 font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed">
              {formattedInput}
            </pre>
          </div>
        </div>
      );
    }
  }
}
