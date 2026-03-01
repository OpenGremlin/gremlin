import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
    >
      <ChevronLeft size={16} className="shrink-0" />
      Back
    </button>
  );
}
