export function formatDate(
  date: string | null | undefined,
  fallback = "Never",
  timeZone?: string,
): string {
  if (!date) return fallback;
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  // Under a minute
  if (diffMin < 1) return "just now";
  // Minutes
  if (diffMin < 60) return `${diffMin}m`;
  // Hours
  if (diffHr < 24 && d.getDate() === now.getDate()) return `${diffHr}h`;
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
    return "Yesterday";
  // Day of week (within ~5 days)
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 6) return DAYS[d.getDay()];
  // Same year
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // Different year
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  return formatTime(dateStr);
}
