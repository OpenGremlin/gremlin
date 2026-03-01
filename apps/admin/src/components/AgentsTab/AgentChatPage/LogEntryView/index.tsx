import { Code, ExternalLink } from "lucide-react";
import type { ChatMessage } from "../useChatMessages";

function safeParseJson(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
      const label = entry.toolName ?? "tool";
      const inputStr = entry.toolInput ?? entry.content;
      let formattedInput = inputStr;
      try {
        formattedInput = JSON.stringify(JSON.parse(inputStr), null, 2);
      } catch {
        // use raw string
      }

      // Render delegateTask as a tappable task card
      if (entry.toolName === "delegateTask" && onTaskClick) {
        const input = safeParseJson(entry.toolInput);
        const result = safeParseJson(entry.toolResult);
        const taskTitle = (input?.title as string) ?? "Untitled task";
        const taskId = (result?.taskId as string) ?? null;
        return (
          <div id={entry.id} className="py-1 px-2">
            <button
              type="button"
              onClick={() => taskId && onTaskClick(taskId)}
              className="w-full text-left bg-indigo-950/40 border border-indigo-800/50 rounded-lg px-3 py-2.5 hover:border-indigo-600/60 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink
                  size={14}
                  className="text-indigo-400 shrink-0"
                />
                <span className="text-sm text-indigo-200 font-medium flex-1 truncate">
                  {taskTitle}
                </span>
                <span className="text-[10px] text-neutral-600">
                  {formatTime(entry.createdAt)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 ml-[22px]">
                Delegated task
              </p>
            </button>
          </div>
        );
      }

      return (
        <div id={entry.id} className="py-1 px-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/50">
              <Code size={12} className="text-neutral-500 shrink-0" />
              <span className="text-[11px] text-neutral-400 font-mono">
                {label}
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
