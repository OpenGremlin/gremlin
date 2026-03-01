import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const className =
  "flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200 transition-colors";

export function BackButton({ to, label = "Back" }: { to?: string; label?: string }) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Link to={to} className={className}>
        <ChevronLeft size={16} className="shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={className}
    >
      <ChevronLeft size={16} className="shrink-0" />
      {label}
    </button>
  );
}
