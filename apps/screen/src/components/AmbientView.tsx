import { useEffect, useState } from "react";

export function AmbientView() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = time.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full w-full flex flex-col justify-end p-[3%]">
      {/* Time */}
      <div className="text-[7vw] font-extralight leading-none tracking-tight text-white/80">
        {hours}
      </div>

      {/* Date */}
      <div className="text-[1.2vw] font-light text-white/25 mt-[0.5vw] tracking-wide">
        {date}
      </div>

      {/* Ambient info row */}
      <div className="flex gap-[3vw] mt-[2vw]">
        <AmbientChip label="72°F" sublabel="Clear" />
        <AmbientChip label="12 min" sublabel="Commute" />
        <AmbientChip label="3 events" sublabel="Today" />
      </div>
    </div>
  );
}

function AmbientChip({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[1.1vw] font-light text-white/40">{label}</span>
      <span className="text-[0.6vw] text-white/15 uppercase tracking-widest">
        {sublabel}
      </span>
    </div>
  );
}
