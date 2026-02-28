const variants: Record<string, string> = {
  running: "bg-green-500/15 text-green-400",
  idle: "bg-neutral-500/15 text-neutral-400",
  error: "bg-red-500/15 text-red-400",
  paused: "bg-amber-500/15 text-amber-400",
  completed: "bg-indigo-500/15 text-indigo-400",
  research: "bg-purple-500/15 text-purple-400",
  task: "bg-blue-500/15 text-blue-400",
  monitor: "bg-teal-500/15 text-teal-400",
  report: "bg-orange-500/15 text-orange-400",
  installed: "bg-green-500/15 text-green-400",
  available: "bg-indigo-500/15 text-indigo-400",
};

export function Badge({ label }: { label: string }) {
  const cls = variants[label.toLowerCase()] ?? variants.idle;
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
}
