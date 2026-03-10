export const categoryLabels: Record<string, string> = {
  ai: "AI Models",
  developer: "Developer",
  web: "Web",
  productivity: "Productivity",
  communication: "Communication",
  entertainment: "Entertainment",
  smart_home: "Smart Home",
};

export const categoryOrder = [
  "ai",
  "developer",
  "web",
  "productivity",
  "communication",
  "entertainment",
  "smart_home",
];

export function groupByCategory<T extends { category: string }>(
  items: T[],
): Array<{ category: string; label: string; items: T[] }> {
  return categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] ?? cat,
      items: items.filter((item) => item.category === cat),
    }))
    .filter((g) => g.items.length > 0);
}
