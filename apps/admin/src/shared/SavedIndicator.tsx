import { Check } from "lucide-react";

export function SavedIndicator() {
  return (
    <span className="flex items-center gap-1 text-xs text-green-400">
      <Check size={14} />
      Saved
    </span>
  );
}
