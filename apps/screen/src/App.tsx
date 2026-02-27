import type { AvatarState, LayoutMode } from "@gremlin/shared-types";
import { useEffect, useState } from "react";

export function App() {
  const [mode] = useState<LayoutMode>("idle");
  const [avatar] = useState<AvatarState>("dormant");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* Header */}
      <h1 className="text-5xl font-light tracking-wide opacity-80">Gremlin</h1>

      {/* Clock */}
      <div className="text-8xl font-extralight tabular-nums">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* Status bar */}
      <div className="flex gap-6 text-sm opacity-50">
        <span>Mode: {mode}</span>
        <span>Avatar: {avatar}</span>
      </div>

      {/* Avatar placeholder */}
      <div className="mt-8">
        <div
          className="w-4 h-4 rounded-full bg-white/20 animate-pulse"
          title="Avatar — dormant"
        />
      </div>
    </div>
  );
}
