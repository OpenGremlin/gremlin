import { ArrowRight } from "lucide-react";

export function ChatInputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Message…"
          disabled={disabled}
          className="flex-1 bg-neutral-800 text-sm text-neutral-100 rounded-full px-4 py-2 outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          <ArrowRight size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
