export const connectionCategoryLabels: Record<string, string> = {
  ai: "AI Models",
  developer: "Developer",
  web: "Web Search",
  productivity: "Productivity",
  communication: "Communication",
  entertainment: "Entertainment",
  smart_home: "Smart Home",
};

export const connectionCategoryOrder = [
  "ai",
  "web",
  "productivity",
  "communication",
  "entertainment",
  "smart_home",
  "developer",
];

export const skillCategoryLabels: Record<string, string> = {
  "google-workspace": "Google Workspace",
  productivity: "Productivity",
  developer: "Developer",
  communication: "Communication",
};

export const skillCategoryOrder = [
  "google-workspace",
  "productivity",
  "communication",
  "developer",
];

function groupBy<T extends { category?: string | null }>(
  items: T[],
  order: string[],
  labels: Record<string, string>,
): Array<{ category: string; label: string; items: T[] }> {
  return order
    .map((cat) => ({
      category: cat,
      label: labels[cat] ?? cat,
      items: items.filter((item) => item.category === cat),
    }))
    .filter((g) => g.items.length > 0);
}

export function groupByCategory<T extends { category?: string | null }>(
  items: T[],
): Array<{ category: string; label: string; items: T[] }> {
  return groupBy(items, connectionCategoryOrder, connectionCategoryLabels);
}

export function groupSkillsByCategory<T extends { category?: string | null }>(
  items: T[],
): Array<{ category: string; label: string; items: T[] }> {
  return groupBy(items, skillCategoryOrder, skillCategoryLabels);
}
