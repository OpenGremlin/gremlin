import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-800/60 bg-neutral-950/70 backdrop-blur-md px-3 py-3.5">
      <div className="flex items-end gap-2">
        <input
          ref={inputRef}
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
              // Refocus after send (React may blur during state update)
              requestAnimationFrame(() => inputRef.current?.focus());
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
