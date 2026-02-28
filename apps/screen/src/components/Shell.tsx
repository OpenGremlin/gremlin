import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="relative w-full h-full max-h-[56.25vw] max-w-[177.78vh] aspect-video">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d1f] to-[#0a0f1a]" />

        {/* Subtle mesh accent */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-[20%] w-[40%] h-[50%] bg-gradient-radial from-indigo-950/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-[10%] w-[30%] h-[40%] bg-gradient-radial from-slate-900/30 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full w-full">{children}</div>
      </div>
    </div>
  );
}
