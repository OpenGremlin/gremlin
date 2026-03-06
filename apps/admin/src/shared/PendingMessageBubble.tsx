import { Loader2 } from "lucide-react";

export function PendingMessageBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end py-1">
      <div className="max-w-[80%] flex items-start gap-2">
        <div className="text-white/60 text-sm px-3.5 py-2 rounded-2xl rounded-br-md bg-blue-600/40 border border-blue-500/20">
          {content}
        </div>
        <Loader2
          size={14}
          className="animate-spin text-blue-400 shrink-0 mt-2.5"
        />
      </div>
    </div>
  );
}
