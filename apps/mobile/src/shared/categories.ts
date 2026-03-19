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
  data: "Data & Media",
  web: "Web",
};

export const skillCategoryOrder = [
  "google-workspace",
  "data",
  "web",
  "productivity",
  "communication",
  "developer",
];

function titleCase(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupBy<T extends { category?: string | null }>(
  items: T[],
  order: string[],
  labels: Record<string, string>,
): Array<{ category: string; label: string; items: T[] }> {
  // Single-pass: bucket items by category
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    if (!item.category) continue;
    let bucket = buckets.get(item.category);
    if (!bucket) {
      bucket = [];
      buckets.set(item.category, bucket);
    }
    bucket.push(item);
  }

  // Emit known categories in order, then any extras
  const result: Array<{ category: string; label: string; items: T[] }> = [];
  const seen = new Set<string>();
  for (const cat of order) {
    seen.add(cat);
    const bucket = buckets.get(cat);
    if (bucket) {
      result.push({
        category: cat,
        label: labels[cat] ?? titleCase(cat),
        items: bucket,
      });
    }
  }
  for (const [cat, bucket] of buckets) {
    if (!seen.has(cat)) {
      result.push({
        category: cat,
        label: labels[cat] ?? titleCase(cat),
        items: bucket,
      });
    }
  }
  return result;
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
