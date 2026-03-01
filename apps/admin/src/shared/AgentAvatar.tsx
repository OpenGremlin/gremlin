import type { Agent } from "../types";

type Size = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<Size, { container: string; text: string }> = {
  xs: { container: "w-8 h-8", text: "text-[10px]" },
  sm: { container: "w-9 h-9", text: "text-xs" },
  md: { container: "w-12 h-12", text: "text-sm" },
  lg: { container: "w-16 h-16", text: "text-lg" },
};

export function AgentAvatar({
  src,
  name,
  status,
  size = "md",
}: {
  src: string;
  name: string;
  status?: Agent["status"];
  size?: Size;
}) {
  const s = sizeClasses[size];

  const ringClass = status
    ? `avatar-ring ${
        status === "ACTIVE"
          ? "avatar-ring-active"
          : status === "SCHEDULED"
            ? "avatar-ring-scheduled"
            : "avatar-ring-idle"
      }`
    : "";

  return (
    <div
      className={`${s.container} shrink-0 flex items-center justify-center ${ringClass}`}
    >
      <div
        className={`w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden ${s.text} text-neutral-400 font-medium`}
      >
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.textContent = name[0];
          }}
        />
      </div>
    </div>
  );
}
