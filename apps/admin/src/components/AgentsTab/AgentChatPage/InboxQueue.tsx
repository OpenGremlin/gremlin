import { Clock, Inbox } from "lucide-react";
import type { InboxItem } from "./useInboxItems";

function formatType(type: string): string {
  switch (type) {
    case "user_message":
      return "Message";
    case "run_task":
      return "Task";
    case "scheduled_job":
      return "Scheduled job";
    case "agent_self_followup":
      return "Follow-up";
    case "user_notification_reply":
      return "Reply";
    default:
      return type;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parsePayloadPreview(type: string, payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    if (type === "user_message") return parsed.content ?? "";
    if (type === "run_task") return parsed.prompt?.slice(0, 80) ?? "";
    if (type === "scheduled_job") return `Job ${parsed.jobId ?? ""}`;
    if (type === "agent_self_followup")
      return parsed.prompt?.slice(0, 80) ?? "";
    if (type === "user_notification_reply")
      return `Action: ${parsed.actionId ?? ""}`;
    return "";
  } catch {
    return "";
  }
}

export function InboxQueue({ items }: { items: InboxItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mx-3 mb-2 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Inbox size={12} className="text-amber-500" />
        <span className="text-[11px] text-amber-400 font-medium">
          Queued ({items.length})
        </span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 text-[11px] text-amber-200/70"
          >
            <Clock size={10} className="text-amber-600 shrink-0" />
            <span className="font-medium text-amber-300/80">
              {formatType(item.type)}
            </span>
            <span className="truncate flex-1 opacity-70">
              {parsePayloadPreview(item.type, item.payload)}
            </span>
            <span className="text-amber-600 shrink-0">
              {formatTime(item.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
