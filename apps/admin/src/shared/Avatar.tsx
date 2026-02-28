/** Compact agent avatar for list items — simplified dust sprite */
export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  // Deterministic hue from name
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className={`${dim} rounded-full relative flex items-center justify-center shrink-0`}
      style={{
        background: `radial-gradient(circle at 44% 40%, hsl(${hue} 15% 28%), hsl(${hue} 10% 12%))`,
        boxShadow: `0 0 8px 2px hsla(${hue} 30% 50% / 0.15)`,
      }}
    >
      {/* Eyes */}
      <div className="flex gap-[3px]">
        <div className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.4)]">
          <div className="w-[2px] h-[2px] rounded-full bg-neutral-900 mt-[1.5px] ml-[1.5px]" />
        </div>
        <div className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.4)]">
          <div className="w-[2px] h-[2px] rounded-full bg-neutral-900 mt-[1.5px] ml-[1.5px]" />
        </div>
      </div>
    </div>
  );
}
