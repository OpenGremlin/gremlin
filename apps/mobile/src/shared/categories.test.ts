import { describe, expect, it } from "vitest";
import { categoryLabels, groupByCategory } from "./categories";

describe("groupByCategory", () => {
  it("groups items by their category", () => {
    const items = [
      { category: "ai", name: "GPT" },
      { category: "ai", name: "Claude" },
      { category: "web", name: "Scraper" },
    ];
    const result = groupByCategory(items);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe("ai");
    expect(result[0].items).toHaveLength(2);
    expect(result[1].category).toBe("web");
    expect(result[1].items).toHaveLength(1);
  });

  it("maintains categoryOrder", () => {
    const items = [
      { category: "web", name: "A" },
      { category: "ai", name: "B" },
    ];
    const result = groupByCategory(items);
    expect(result[0].category).toBe("ai");
    expect(result[1].category).toBe("web");
  });

  it("filters out empty categories", () => {
    const items = [{ category: "ai", name: "Claude" }];
    const result = groupByCategory(items);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("ai");
  });

  it("uses categoryLabels for display label", () => {
    const items = [{ category: "smart_home", name: "Light" }];
    const result = groupByCategory(items);
    expect(result[0].label).toBe(categoryLabels.smart_home);
  });

  it("returns empty array for no items", () => {
    expect(groupByCategory([])).toEqual([]);
  });

  it("ignores items with unknown categories", () => {
    const items = [{ category: "unknown", name: "Mystery" }];
    const result = groupByCategory(items);
    expect(result).toEqual([]);
  });
});
