const variants: Record<string, string> = {
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
