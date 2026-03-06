import { Check, Volume2, X } from "lucide-react";

export const INWORLD_VOICES = [
  "Alex",
  "Arjun",
  "Ashley",
  "Blake",
  "Carter",
  "Clive",
  "Dennis",
  "Dominus",
  "Edward",
  "Ethan",
  "Evelyn",
  "Graham",
  "Hades",
  "Hana",
  "Hank",
  "Jason",
  "Julia",
  "Kayla",
  "Lauren",
  "Nate",
  "Oliver",
  "Olivia",
  "Priya",
  "Ronald",
  "Shaun",
  "Simon",
  "Snik",
  "Theodore",
  "Victor",
  "Victoria",
  "Vinny",
] as const;

export function VoicePicker({
  currentVoice,
  onSelect,
  onClose,
}: {
  currentVoice: string | null | undefined;
  onSelect: (voice: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Choose Voice"
      className="fixed inset-0 z-50 flex items-end justify-center"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-t-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-semibold text-neutral-100">
            Choose Voice
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                !currentVoice
                  ? "bg-neutral-700 text-neutral-100"
                  : "hover:bg-neutral-800 text-neutral-400"
              }`}
            >
              <span className="text-sm">None</span>
              {!currentVoice && <Check size={14} className="ml-auto" />}
            </button>
            {INWORLD_VOICES.map((voice) => (
              <button
                key={voice}
                type="button"
                onClick={() => onSelect(voice)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                  currentVoice === voice
                    ? "bg-neutral-700 text-neutral-100"
                    : "hover:bg-neutral-800 text-neutral-400"
                }`}
              >
                <Volume2 size={14} className="shrink-0" />
                <span className="text-sm">{voice}</span>
                {currentVoice === voice && (
                  <Check size={14} className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
