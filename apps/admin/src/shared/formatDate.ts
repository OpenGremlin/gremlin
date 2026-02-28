export function formatDate(
  date: string | null,
  fallback = "Never",
): string {
  if (!date) return fallback;
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
